import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string, query: PaginationQueryDto) {
    const where = { userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: { lastAccessedAt: { sort: 'desc', nulls: 'last' } },
        skip: query.skip,
        take: query.limit,
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              icon: true,
              thumbnailUrl: true,
              lessonCount: true,
              durationMin: true,
              level: true,
              instructor: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  /** Mendaftarkan user. Kursus berbayar hanya boleh lewat pembayaran lunas. */
  async enroll(userId: string, courseId: string, source = 'PURCHASE') {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isFree: true, status: true, priceIDR: true },
    });
    if (!course) throw new NotFoundException('course.notFound');
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('course.notPublished');
    }

    const isPaidCourse = !course.isFree && course.priceIDR > 0;
    if (isPaidCourse && source === 'PURCHASE') {
      const paid = await this.prisma.payment.findFirst({
        where: { userId, status: 'PAID', items: { some: { courseId } } },
        select: { id: true },
      });
      if (!paid) {
        throw new ForbiddenException('enrollment.paymentRequired');
      }
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, source },
      update: {},
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { studentCount: { increment: 1 } },
    });

    return enrollment;
  }

  /** Menandai lesson selesai / menyimpan posisi tonton, lalu hitung ulang progres. */
  async trackProgress(
    userId: string,
    lessonId: string,
    body: { completed?: boolean; resumeSecond?: number; watchedSec?: number },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, module: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('lesson.notFound');

    const courseId = lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
    if (!enrollment) throw new ForbiddenException('enrollment.notEnrolled');

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completed: body.completed ?? false,
        resumeSecond: body.resumeSecond ?? 0,
        watchedSec: body.watchedSec ?? 0,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        ...(body.completed !== undefined && {
          completed: body.completed,
          completedAt: body.completed ? new Date() : null,
        }),
        ...(body.resumeSecond !== undefined && { resumeSecond: body.resumeSecond }),
        ...(body.watchedSec !== undefined && { watchedSec: body.watchedSec }),
      },
    });

    return this.recalculateProgress(userId, courseId);
  }

  /**
   * Tugas dari seluruh kursus yang diikuti siswa, digabung dengan status
   * submission miliknya. Dipakai halaman "Tugas & Nilai".
   */
  async myAssignments(userId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        lesson: { module: { course: { enrollments: { some: { userId } } } } },
      },
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }],
      select: {
        id: true,
        title: true,
        brief: true,
        maxPoints: true,
        dueAt: true,
        rubric: true,
        lesson: {
          select: {
            title: true,
            module: {
              select: { title: true, course: { select: { slug: true, title: true } } },
            },
          },
        },
        submissions: {
          where: { userId },
          orderBy: { attempt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            grade: true,
            feedback: true,
            attempt: true,
            createdAt: true,
            gradedAt: true,
          },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      brief: a.brief,
      maxPoints: a.maxPoints,
      dueAt: a.dueAt,
      rubric: a.rubric,
      lessonTitle: a.lesson.title,
      moduleTitle: a.lesson.module.title,
      courseSlug: a.lesson.module.course.slug,
      courseTitle: a.lesson.module.course.title,
      submission: a.submissions[0] ?? null,
    }));
  }

  /** Mengirim atau memperbarui jawaban tugas milik siswa. */
  async submitAssignment(
    userId: string,
    assignmentId: string,
    body: { contentHtml?: string; codeSnippet?: string; fileUrls?: string[] },
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });
    if (!assignment) throw new NotFoundException('assignment.notFound');

    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: assignment.lesson.module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) throw new ForbiddenException('enrollment.notEnrolled');

    const previous = await this.prisma.submission.findFirst({
      where: { assignmentId, userId },
      orderBy: { attempt: 'desc' },
      select: { id: true, attempt: true, status: true },
    });

    // Submission yang sudah dinilai tidak ditimpa — dibuat percobaan baru.
    if (previous && previous.status !== 'GRADED') {
      return this.prisma.submission.update({
        where: { id: previous.id },
        data: { ...body, status: 'SUBMITTED' },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId,
        userId,
        ...body,
        status: 'SUBMITTED',
        attempt: (previous?.attempt ?? 0) + 1,
      },
    });
  }

  async recalculateProgress(userId: string, courseId: string) {
    const [totalLessons, completed] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where: { module: { courseId } } }),
      this.prisma.lessonProgress.count({
        where: { userId, completed: true, lesson: { module: { courseId } } },
      }),
    ]);

    const progressPct = totalLessons
      ? Math.round((completed / totalLessons) * 100)
      : 0;

    return this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progressPct,
        completedLessons: completed,
        lastAccessedAt: new Date(),
        completedAt: progressPct === 100 ? new Date() : null,
      },
      select: {
        id: true,
        courseId: true,
        progressPct: true,
        completedLessons: true,
        completedAt: true,
      },
    });
  }
}
