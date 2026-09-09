import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBannerDto,
  CreateCouponDto,
  CreateFaqDto,
  CreateNavItemDto,
  CreatePageDto,
  CreatePricingPlanDto,
  CreateTestimonialDto,
  SiteSettingsDto,
  UpdateBannerDto,
  UpdateCouponDto,
  UpdateFaqDto,
  UpdateNavItemDto,
  UpdatePageDto,
  UpdatePricingPlanDto,
  UpdateTestimonialDto,
} from './dto/cms.dto';

export const DEFAULT_SETTINGS: SiteSettingsDto = {
  brandName: 'TestCraft Indonesia',
  tagline: 'Learn. Build. Automate.',
  primaryColor: '#0E9C9C',
  contactEmail: 'testcraftindonesia@gmail.com',
  whatsapp: '6282395568743',
  socials: {},
  defaultCurrency: 'IDR',
  usdRate: 16000,
  taxPercent: 11,
  maintenanceMode: false,
};

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------- Settings ----------------------------- */

  async getSettings(): Promise<SiteSettingsDto> {
    const row = await this.prisma.siteSetting.findUnique({
      where: { id: 'singleton' },
    });
    // Merge dengan default agar field baru tidak undefined di FE lama.
    return { ...DEFAULT_SETTINGS, ...((row?.data as object) ?? {}) };
  }

  async updateSettings(dto: SiteSettingsDto): Promise<SiteSettingsDto> {
    const merged = { ...(await this.getSettings()), ...dto };
    await this.prisma.siteSetting.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', data: merged as unknown as Prisma.JsonObject },
      update: { data: merged as unknown as Prisma.JsonObject },
    });
    return merged;
  }

  /* ------------------------------ Pages ------------------------------- */

  listPages(status?: ContentStatus) {
    return this.prisma.page.findMany({
      where: status ? { status } : {},
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        _count: { select: { blocks: true } },
      },
    });
  }

  async getPage(slug: string, publishedOnly = false) {
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        ...(publishedOnly ? { status: ContentStatus.PUBLISHED } : {}),
      },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });
    if (!page) throw new NotFoundException('page.notFound');
    return page;
  }

  createPage(dto: CreatePageDto) {
    const { blocks, ...page } = dto;
    return this.prisma.page.create({
      data: {
        ...page,
        publishedAt: page.status === ContentStatus.PUBLISHED ? new Date() : null,
        blocks: blocks?.length
          ? {
              create: blocks.map((b) => ({
                type: b.type,
                order: b.order,
                visible: b.visible ?? true,
                data: b.data as Prisma.JsonObject,
              })),
            }
          : undefined,
      },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });
  }

  /**
   * Update halaman. Bila `blocks` dikirim, seluruh blok diganti (replace-all)
   * dalam satu transaksi — ini menyederhanakan reorder & delete dari editor CMS.
   */
  async updatePage(id: string, dto: UpdatePageDto) {
    const { blocks, ...page } = dto;
    const current = await this.prisma.page.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!current) throw new NotFoundException('page.notFound');

    return this.prisma.$transaction(async (tx) => {
      if (blocks) {
        await tx.contentBlock.deleteMany({ where: { pageId: id } });
        await tx.contentBlock.createMany({
          data: blocks.map((b, i) => ({
            pageId: id,
            type: b.type,
            order: b.order ?? i,
            visible: b.visible ?? true,
            data: b.data as Prisma.JsonObject,
          })),
        });
      }
      return tx.page.update({
        where: { id },
        data: {
          ...page,
          ...(page.status === ContentStatus.PUBLISHED && !current.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
        include: { blocks: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async publishPage(id: string) {
    return this.prisma.page.update({
      where: { id },
      data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async deletePage(id: string) {
    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  /* ----------------------------- Banners ------------------------------ */

  listBanners(activeOnly = false) {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: activeOnly
        ? {
            active: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            ],
          }
        : {},
      orderBy: { updatedAt: 'desc' },
    });
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  updateBanner(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }

  /* --------------------------- Pricing plans -------------------------- */

  listPlans(activeOnly = false) {
    return this.prisma.pricingPlan.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { order: 'asc' },
    });
  }

  createPlan(dto: CreatePricingPlanDto) {
    return this.prisma.pricingPlan.create({
      data: { ...dto, features: dto.features ?? [] },
    });
  }

  updatePlan(id: string, dto: UpdatePricingPlanDto) {
    return this.prisma.pricingPlan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string) {
    await this.prisma.pricingPlan.delete({ where: { id } });
    return { ok: true };
  }

  /* ------------------------------ Coupons ----------------------------- */

  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createCoupon(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        appliesToCourseIds: dto.appliesToCourseIds ?? [],
      },
    });
  }

  updateCoupon(id: string, dto: UpdateCouponDto) {
    return this.prisma.coupon.update({
      where: { id },
      data: { ...dto, ...(dto.code && { code: dto.code.toUpperCase() }) },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { ok: true };
  }

  /* -------------------------- Testimonials/FAQ ------------------------ */

  listTestimonials(featuredOnly = false) {
    return this.prisma.testimonial.findMany({
      where: featuredOnly ? { featured: true } : {},
      orderBy: { order: 'asc' },
    });
  }

  createTestimonial(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  updateTestimonial(id: string, dto: UpdateTestimonialDto) {
    return this.prisma.testimonial.update({ where: { id }, data: dto });
  }

  async deleteTestimonial(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    return { ok: true };
  }

  listFaqs(publishedOnly = false) {
    return this.prisma.faq.findMany({
      where: publishedOnly ? { published: true } : {},
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
    });
  }

  createFaq(dto: CreateFaqDto) {
    return this.prisma.faq.create({ data: dto });
  }

  updateFaq(id: string, dto: UpdateFaqDto) {
    return this.prisma.faq.update({ where: { id }, data: dto });
  }

  async deleteFaq(id: string) {
    await this.prisma.faq.delete({ where: { id } });
    return { ok: true };
  }

  /* ----------------------------- Navigation --------------------------- */

  listNav(menu?: string) {
    return this.prisma.navigationItem.findMany({
      where: { ...(menu ? { menu } : {}), visible: true },
      orderBy: [{ menu: 'asc' }, { order: 'asc' }],
    });
  }

  createNav(dto: CreateNavItemDto) {
    return this.prisma.navigationItem.create({ data: dto });
  }

  updateNav(id: string, dto: UpdateNavItemDto) {
    return this.prisma.navigationItem.update({ where: { id }, data: dto });
  }

  async deleteNav(id: string) {
    await this.prisma.navigationItem.delete({ where: { id } });
    return { ok: true };
  }

  /* ------------------------------- Media ------------------------------ */

  listMedia(folder?: string) {
    return this.prisma.mediaAsset.findMany({
      where: folder ? { folder } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
