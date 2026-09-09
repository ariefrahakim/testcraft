import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUpdateUserDto, UpdateProfileDto } from './dto/user.dto';

const SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  avatarUrl: true,
  bio: true,
  xp: true,
  level: true,
  streakDays: true,
  isActive: true,
  companyId: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto, role?: Role) {
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: SELECT,
    });
  }

  adminUpdate(id: string, dto: AdminUpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: SELECT });
  }

  listInstructors() {
    return this.prisma.instructorProfile.findMany({
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        headline: true,
        bio: true,
        expYears: true,
        rating: true,
        totalStudents: true,
        totalCourses: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }
}
