import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [
      students,
      instructors,
      publishedCourses,
      enrollments,
      certificates,
      revenue,
      revenue30d,
      pendingPayments,
      newLeads,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.instructorProfile.count(),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count({ where: { revokedAt: null } }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.lead.count({ where: { handled: false } }),
    ]);

    return {
      students,
      instructors,
      publishedCourses,
      enrollments,
      certificates,
      revenueTotalIDR: revenue._sum.total ?? 0,
      revenue30dIDR: revenue30d._sum.total ?? 0,
      orders30d: revenue30d._count,
      pendingPayments,
      unhandledLeads: newLeads,
    };
  }

  /** Kursus terlaris berdasarkan jumlah enrollment. */
  topCourses() {
    return this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { studentCount: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        icon: true,
        studentCount: true,
        rating: true,
        priceIDR: true,
      },
    });
  }

  /** Pendapatan per bulan untuk 12 bulan terakhir. */
  async revenueByMonth() {
    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; total: bigint; orders: bigint }>
    >`
      SELECT to_char(date_trunc('month', "paidAt"), 'YYYY-MM') AS month,
             SUM(total)::bigint AS total,
             COUNT(*)::bigint AS orders
      FROM "Payment"
      WHERE status = 'PAID' AND "paidAt" >= now() - interval '12 months'
      GROUP BY 1
      ORDER BY 1
    `;

    return rows.map((r) => ({
      month: r.month,
      total: Number(r.total),
      orders: Number(r.orders),
    }));
  }
}
