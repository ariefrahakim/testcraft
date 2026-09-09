import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SubmissionStatus } from '@prisma/client';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeSubmissionDto } from './dto/instructor.dto';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Profil instruktur milik user; admin boleh melihat semua. */
  private async profileIdFor(userId: string): Promise<string | null> {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  async myCourses(userId: string, role: Role) {
    const instructorId = await this.profileIdFor(userId);
    if (!instructorId && role === Role.INSTRUCTOR) {
      throw new ForbiddenException('instructor.profileMissing');
    }
    return this.prisma.course.findMany({
      where: instructorId && role === Role.INSTRUCTOR ? { instructorId } : {},
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        status: true,
        level: true,
        studentCount: true,
        rating: true,
        reviewCount: true,
        lessonCount: true,
        priceIDR: true,
        category: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  /**
   * Antrian penilaian: submission yang menunggu dinilai, diurutkan dari
   * deadline paling mendesak. FE memberi warna berdasarkan `dueAt`.
   */
  async gradingQueue(
    userId: string,
    role: Role,
    query: PaginationQueryDto,
    status: SubmissionStatus = SubmissionStatus.SUBMITTED,
    courseId?: string,
  ) {
    const instructorId = await this.profileIdFor(userId);
    const scope: Prisma.SubmissionWhereInput =
      role === Role.INSTRUCTOR && instructorId
        ? { assignment: { lesson: { module: { course: { instructorId } } } } }
        : {};

    const where: Prisma.SubmissionWhereInput = {
      ...scope,
      status,
      ...(courseId && {
        assignment: { lesson: { module: { courseId } } },
      }),
      ...(query.q && {
        user: {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.submission.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }],
        skip: query.skip,
        take: query.limit,
        select: {
          id: true,
          status: true,
          grade: true,
          attempt: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              maxPoints: true,
              dueAt: true,
              rubric: true,
              lesson: {
                select: {
                  title: true,
                  module: {
                    select: { title: true, course: { select: { id: true, title: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    const data = rows.map((s) => ({
      id: s.id,
      status: s.status,
      grade: s.grade,
      attempt: s.attempt,
      submittedAt: s.createdAt,
      student: s.user,
      assignmentId: s.assignment.id,
      assignmentTitle: s.assignment.title,
      maxPoints: s.assignment.maxPoints,
      dueAt: s.assignment.dueAt,
      rubric: s.assignment.rubric,
      lessonTitle: s.assignment.lesson.title,
      moduleTitle: s.assignment.lesson.module.title,
      courseId: s.assignment.lesson.module.course.id,
      courseTitle: s.assignment.lesson.module.course.title,
    }));

    return paginate(data, total, query.page, query.limit);
  }

  /** Ringkasan per tugas: berapa yang belum dinilai + deadline terdekat. */
  async pendingSummary(userId: string, role: Role) {
    const instructorId = await this.profileIdFor(userId);
    const scope: Prisma.SubmissionWhereInput =
      role === Role.INSTRUCTOR && instructorId
        ? { assignment: { lesson: { module: { course: { instructorId } } } } }
        : {};

    const rows = await this.prisma.submission.findMany({
      where: { ...scope, status: SubmissionStatus.SUBMITTED },
      select: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueAt: true,
            lesson: {
              select: { module: { select: { course: { select: { id: true, title: true } } } } },
            },
          },
        },
      },
    });

    const byAssignment = new Map<
      string,
      { assignmentId: string; assignmentTitle: string; courseId: string; courseTitle: string; dueAt: Date | null; pending: number }
    >();
    for (const r of rows) {
      const a = r.assignment;
      const course = a.lesson.module.course;
      const entry = byAssignment.get(a.id) ?? {
        assignmentId: a.id,
        assignmentTitle: a.title,
        courseId: course.id,
        courseTitle: course.title,
        dueAt: a.dueAt,
        pending: 0,
      };
      entry.pending += 1;
      byAssignment.set(a.id, entry);
    }

    return [...byAssignment.values()].sort((a, b) => {
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
  }

  async grade(userId: string, role: Role, submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        assignment: {
          select: {
            maxPoints: true,
            title: true,
            lesson: { select: { module: { select: { course: { select: { instructorId: true } } } } } },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('submission.notFound');

    if (role === Role.INSTRUCTOR) {
      const instructorId = await this.profileIdFor(userId);
      if (submission.assignment.lesson.module.course.instructorId !== instructorId) {
        throw new ForbiddenException('grading.notYourCourse');
      }
    }

    const graded = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: Math.min(dto.grade, submission.assignment.maxPoints),
        feedback: dto.feedback,
        status: dto.returnForRevision
          ? SubmissionStatus.RETURNED
          : SubmissionStatus.GRADED,
        gradedById: userId,
        gradedAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: submission.userId,
        type: 'ASSIGNMENT',
        title: dto.returnForRevision
          ? `Tugas "${submission.assignment.title}" perlu revisi`
          : `Tugas "${submission.assignment.title}" sudah dinilai`,
        body: dto.feedback?.slice(0, 200),
        link: '/dashboard',
      },
    });

    return graded;
  }

  /** Ringkasan pendapatan instruktur dari penjualan kursusnya. */
  async payouts(userId: string, role: Role) {
    const instructorId = await this.profileIdFor(userId);
    if (!instructorId && role === Role.INSTRUCTOR) {
      throw new ForbiddenException('instructor.profileMissing');
    }

    const items = await this.prisma.orderItem.findMany({
      where: {
        payment: { status: 'PAID' },
        ...(instructorId && role === Role.INSTRUCTOR ? { course: { instructorId } } : {}),
      },
      select: {
        priceSnapshot: true,
        titleSnapshot: true,
        payment: { select: { paidAt: true, invoiceNo: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { payment: { paidAt: 'desc' } },
      take: 200,
    });

    const gross = items.reduce((sum, i) => sum + i.priceSnapshot, 0);
    const REVENUE_SHARE = 0.6; // 60% bagian instruktur

    return {
      grossIDR: gross,
      sharePct: REVENUE_SHARE * 100,
      estimatedPayoutIDR: Math.round(gross * REVENUE_SHARE),
      transactions: items.map((i) => ({
        invoiceNo: i.payment.invoiceNo,
        paidAt: i.payment.paidAt,
        courseTitle: i.course.title,
        amountIDR: i.priceSnapshot,
        payoutIDR: Math.round(i.priceSnapshot * REVENUE_SHARE),
      })),
    };
  }
}
