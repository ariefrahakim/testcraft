import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BulkPricingDto,
  CourseQueryDto,
  CreateCourseDto,
  UpdateCourseDto,
  UpdateCoursePricingDto,
} from './dto/course.dto';

const SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  level: true,
  status: true,
  thumbnailUrl: true,
  icon: true,
  durationMin: true,
  lessonCount: true,
  rating: true,
  reviewCount: true,
  studentCount: true,
  priceIDR: true,
  priceUSD: true,
  compareAtIDR: true,
  compareAtUSD: true,
  isBestseller: true,
  isFeatured: true,
  isFree: true,
  category: { select: { id: true, name: true, slug: true, icon: true } },
  instructor: {
    select: {
      id: true,
      headline: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.CourseSelect;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CourseQueryDto, includeUnpublished = false) {
    const where: Prisma.CourseWhereInput = {
      status: includeUnpublished
        ? query.status
        : CourseStatus.PUBLISHED,
      ...(query.category && { category: { slug: query.category } }),
      ...(query.level && { level: query.level }),
      ...(query.free !== undefined && { isFree: query.free }),
      ...(query.featured !== undefined && { isFeatured: query.featured }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        priceIDR: { gte: query.minPrice, lte: query.maxPrice },
      }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { subtitle: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        select: SUMMARY_SELECT,
        orderBy: orderFor(query.sort),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginate(data.map(flattenInstructor), total, query.page, query.limit);
  }

  async findBySlug(slug: string, includeUnpublished = false) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        ...(includeUnpublished ? {} : { status: CourseStatus.PUBLISHED }),
      },
      select: {
        ...SUMMARY_SELECT,
        description: true,
        previewVideoUrl: true,
        outcomes: true,
        prerequisites: true,
        targetAudience: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            summary: true,
            order: true,
            quiz: { select: { id: true } },
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                type: true,
                durationSec: true,
                isPreview: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('course.notFound');

    const { modules, ...rest } = course;
    return {
      ...flattenInstructor(rest),
      modules: modules.map(({ quiz, ...m }) => ({ ...m, hasQuiz: !!quiz })),
    };
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...dto,
        outcomes: dto.outcomes ?? [],
        prerequisites: dto.prerequisites ?? [],
        targetAudience: dto.targetAudience ?? [],
        publishedAt: dto.status === CourseStatus.PUBLISHED ? new Date() : null,
      },
      select: SUMMARY_SELECT,
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const current = await this.prisma.course.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!current) throw new NotFoundException('course.notFound');

    return this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        // Set publishedAt sekali saja, saat pertama kali dipublikasikan.
        ...(dto.status === CourseStatus.PUBLISHED && !current.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
      select: SUMMARY_SELECT,
    });
  }

  async remove(id: string) {
    // Soft delete: kursus yang pernah dibeli tidak boleh hilang dari riwayat.
    await this.prisma.course.update({
      where: { id },
      data: { status: CourseStatus.ARCHIVED },
    });
    return { ok: true };
  }

  async updatePricing(id: string, dto: UpdateCoursePricingDto) {
    return this.prisma.course.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        title: true,
        priceIDR: true,
        priceUSD: true,
        compareAtIDR: true,
        compareAtUSD: true,
        isFree: true,
      },
    });
  }

  async bulkPricing(dto: BulkPricingDto) {
    const updates = dto.items.map(({ courseId, ...data }) =>
      this.prisma.course.update({ where: { id: courseId }, data }),
    );
    const result = await this.prisma.$transaction(updates);
    return { updated: result.length };
  }

  /** Menyegarkan statistik denormalisasi (rating, jumlah lesson & siswa). */
  async refreshStats(courseId: string) {
    const [agg, students, lessons] = await this.prisma.$transaction([
      this.prisma.review.aggregate({
        where: { courseId, published: true },
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
      this.prisma.lesson.count({ where: { module: { courseId } } }),
    ]);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
        studentCount: students,
        lessonCount: lessons,
      },
      select: { id: true, rating: true, reviewCount: true, studentCount: true, lessonCount: true },
    });
  }
}

function orderFor(
  sort: CourseQueryDto['sort'],
): Prisma.CourseOrderByWithRelationInput {
  switch (sort) {
    case 'newest':
      return { publishedAt: 'desc' };
    case 'rating':
      return { rating: 'desc' };
    case 'price_asc':
      return { priceIDR: 'asc' };
    case 'price_desc':
      return { priceIDR: 'desc' };
    default:
      return { studentCount: 'desc' };
  }
}

/** Meratakan relasi instructor.user agar response FE lebih ringkas. */
function flattenInstructor<
  T extends {
    instructor: { id: string; headline: string; user: { name: string; avatarUrl: string | null } };
  },
>(course: T) {
  const { instructor, ...rest } = course;
  return {
    ...rest,
    instructor: {
      id: instructor.id,
      name: instructor.user.name,
      headline: instructor.headline,
      avatarUrl: instructor.user.avatarUrl,
    },
  };
}
