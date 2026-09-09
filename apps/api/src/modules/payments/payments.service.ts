import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency, DiscountType, PaymentProvider, PaymentStatus } from '@prisma/client';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CmsService } from '../cms/cms.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CheckoutDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cms: CmsService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  /**
   * Membuat invoice PENDING. Harga selalu diambil dari DB (bukan dari klien)
   * agar tidak bisa dimanipulasi dari sisi frontend.
   */
  async checkout(userId: string, dto: CheckoutDto) {
    const courses = await this.prisma.course.findMany({
      where: { id: { in: dto.courseIds }, status: 'PUBLISHED' },
      select: { id: true, title: true, priceIDR: true, priceUSD: true, isFree: true },
    });
    if (courses.length !== dto.courseIds.length) {
      throw new BadRequestException('checkout.courseMissing');
    }

    const already = await this.prisma.enrollment.findMany({
      where: { userId, courseId: { in: dto.courseIds } },
      select: { courseId: true },
    });
    if (already.length) {
      throw new BadRequestException('enrollment.alreadyEnrolled');
    }

    const settings = await this.cms.getSettings();
    const currency = dto.currency ?? Currency.IDR;
    const priceOf = (c: (typeof courses)[number]) =>
      currency === Currency.USD ? c.priceUSD : c.priceIDR;

    const subtotal = courses.reduce((sum, c) => sum + priceOf(c), 0);
    const { discount, coupon } = await this.resolveCoupon(
      dto.couponCode,
      subtotal,
      dto.courseIds,
      userId,
    );

    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round((taxable * settings.taxPercent) / 100);
    const total = taxable + tax;

    const payment = await this.prisma.payment.create({
      data: {
        invoiceNo: await this.nextInvoiceNo(),
        userId,
        provider: dto.provider ?? PaymentProvider.MIDTRANS,
        status: PaymentStatus.PENDING,
        currency,
        subtotal,
        discount,
        tax,
        total,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        items: {
          create: courses.map((c) => ({
            courseId: c.id,
            titleSnapshot: c.title,
            priceSnapshot: priceOf(c),
          })),
        },
      },
      include: { items: true },
    });

    // Integrasi gateway sungguhan (Midtrans Snap / Xendit Invoice) dipasang di
    // sini; sementara paymentUrl diarahkan ke halaman simulasi pembayaran.
    return {
      ...payment,
      paymentUrl: `/checkout/${payment.invoiceNo}`,
    };
  }

  /** Validasi kupon dan hitung nominal diskon. */
  private async resolveCoupon(
    code: string | undefined,
    subtotal: number,
    courseIds: string[],
    userId: string,
  ) {
    if (!code) return { discount: 0, coupon: null };

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    const now = new Date();
    if (
      !coupon ||
      !coupon.active ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt < now)
    ) {
      throw new BadRequestException('coupon.invalid');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('coupon.exhausted');
    }
    if (coupon.minPurchaseIDR && subtotal < coupon.minPurchaseIDR) {
      throw new BadRequestException('coupon.minPurchase');
    }
    if (
      coupon.appliesToCourseIds.length &&
      !courseIds.some((id) => coupon.appliesToCourseIds.includes(id))
    ) {
      throw new BadRequestException('coupon.notApplicable');
    }

    const usedByUser = await this.prisma.payment.count({
      where: { userId, couponId: coupon.id, status: PaymentStatus.PAID },
    });
    if (usedByUser >= coupon.maxUsesPerUser) {
      throw new BadRequestException('coupon.alreadyUsed');
    }

    const discount =
      coupon.discountType === DiscountType.PERCENT
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);

    return { discount, coupon };
  }

  /** Dipanggil webhook gateway saat pembayaran lunas. Idempoten. */
  async markPaid(invoiceNo: string, externalId?: string, rawPayload?: unknown) {
    const payment = await this.prisma.payment.findUnique({
      where: { invoiceNo },
      include: { items: true },
    });
    if (!payment) throw new NotFoundException('invoice.notFound');
    if (payment.status === PaymentStatus.PAID) return payment;

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          externalId,
          rawPayload: rawPayload as never,
        },
        include: { items: true },
      });
      if (payment.couponId) {
        await tx.coupon.update({
          where: { id: payment.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return p;
    });

    // Enrollment dibuat setelah transaksi commit agar tidak menahan lock DB.
    for (const item of updated.items) {
      await this.enrollments.enroll(payment.userId, item.courseId, 'PURCHASE');
    }
    await this.prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'PAYMENT',
        title: `Pembayaran ${invoiceNo} berhasil`,
        body: 'Kursus Anda sudah bisa diakses.',
        link: '/dashboard',
      },
    });

    return updated;
  }

  async listMine(userId: string, query: PaginationQueryDto) {
    const where = { userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { items: true },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async listAll(query: PaginationQueryDto, status?: PaymentStatus) {
    const where = {
      ...(status ? { status } : {}),
      ...(query.q ? { invoiceNo: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  private async nextInvoiceNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.payment.count();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
