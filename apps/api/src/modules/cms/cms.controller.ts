import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { CmsService } from './cms.service';
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

/**
 * Endpoint CMS — hanya untuk ADMIN/SUPER_ADMIN.
 * Versi publik (read-only) ada di PublicContentController (`/content/*`).
 */
@ApiTags('CMS (Admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  /* ---------------------------- Settings ----------------------------- */

  @Get('settings')
  @ApiOperation({ summary: 'Ambil pengaturan situs (brand, kurs, pajak, dll.)' })
  getSettings() {
    return this.cms.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Perbarui pengaturan situs' })
  updateSettings(@Body() dto: SiteSettingsDto) {
    return this.cms.updateSettings(dto);
  }

  /* ------------------------------ Pages ------------------------------- */

  @Get('pages')
  @ApiQuery({ name: 'status', enum: ContentStatus, required: false })
  @ApiOperation({ summary: 'Daftar halaman CMS' })
  listPages(@Query('status') status?: ContentStatus) {
    return this.cms.listPages(status);
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Detail halaman beserta blok konten (termasuk draft)' })
  getPage(@Param('slug') slug: string) {
    return this.cms.getPage(slug);
  }

  @Post('pages')
  @ApiOperation({ summary: 'Buat halaman baru' })
  createPage(@Body() dto: CreatePageDto) {
    return this.cms.createPage(dto);
  }

  @Patch('pages/:id')
  @ApiOperation({
    summary: 'Perbarui halaman',
    description:
      'Mengirim `blocks` akan mengganti seluruh blok halaman (replace-all) dalam satu transaksi.',
  })
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.cms.updatePage(id, dto);
  }

  @Post('pages/:id/publish')
  @ApiOperation({ summary: 'Terbitkan halaman' })
  publishPage(@Param('id') id: string) {
    return this.cms.publishPage(id);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'Hapus halaman' })
  deletePage(@Param('id') id: string) {
    return this.cms.deletePage(id);
  }

  /* ----------------------------- Banners ------------------------------ */

  @Get('banners')
  @ApiOperation({ summary: 'Daftar banner/pengumuman' })
  listBanners() {
    return this.cms.listBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: 'Buat banner' })
  createBanner(@Body() dto: CreateBannerDto) {
    return this.cms.createBanner(dto);
  }

  @Patch('banners/:id')
  @ApiOperation({ summary: 'Perbarui banner' })
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.cms.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Hapus banner' })
  deleteBanner(@Param('id') id: string) {
    return this.cms.deleteBanner(id);
  }

  /* --------------------------- Pricing plans -------------------------- */

  @Get('pricing-plans')
  @ApiOperation({ summary: 'Daftar paket harga (bundle/langganan)' })
  listPlans() {
    return this.cms.listPlans();
  }

  @Post('pricing-plans')
  @ApiOperation({ summary: 'Buat paket harga' })
  createPlan(@Body() dto: CreatePricingPlanDto) {
    return this.cms.createPlan(dto);
  }

  @Patch('pricing-plans/:id')
  @ApiOperation({ summary: 'Perbarui paket harga' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePricingPlanDto) {
    return this.cms.updatePlan(id, dto);
  }

  @Delete('pricing-plans/:id')
  @ApiOperation({ summary: 'Hapus paket harga' })
  deletePlan(@Param('id') id: string) {
    return this.cms.deletePlan(id);
  }

  /* ------------------------------ Coupons ----------------------------- */

  @Get('coupons')
  @ApiOperation({ summary: 'Daftar kupon diskon' })
  listCoupons() {
    return this.cms.listCoupons();
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Buat kupon' })
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.cms.createCoupon(dto);
  }

  @Patch('coupons/:id')
  @ApiOperation({ summary: 'Perbarui kupon' })
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.cms.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @ApiOperation({ summary: 'Hapus kupon' })
  deleteCoupon(@Param('id') id: string) {
    return this.cms.deleteCoupon(id);
  }

  /* -------------------------- Testimonials/FAQ ------------------------ */

  @Get('testimonials')
  @ApiOperation({ summary: 'Daftar testimoni' })
  listTestimonials() {
    return this.cms.listTestimonials();
  }

  @Post('testimonials')
  @ApiOperation({ summary: 'Tambah testimoni' })
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.cms.createTestimonial(dto);
  }

  @Patch('testimonials/:id')
  @ApiOperation({ summary: 'Perbarui testimoni' })
  updateTestimonial(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.cms.updateTestimonial(id, dto);
  }

  @Delete('testimonials/:id')
  @ApiOperation({ summary: 'Hapus testimoni' })
  deleteTestimonial(@Param('id') id: string) {
    return this.cms.deleteTestimonial(id);
  }

  @Get('faqs')
  @ApiOperation({ summary: 'Daftar FAQ' })
  listFaqs() {
    return this.cms.listFaqs();
  }

  @Post('faqs')
  @ApiOperation({ summary: 'Tambah FAQ' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.cms.createFaq(dto);
  }

  @Patch('faqs/:id')
  @ApiOperation({ summary: 'Perbarui FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.cms.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @ApiOperation({ summary: 'Hapus FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.cms.deleteFaq(id);
  }

  /* ----------------------------- Navigation --------------------------- */

  @Get('navigation')
  @ApiQuery({ name: 'menu', required: false, example: 'header' })
  @ApiOperation({ summary: 'Daftar item menu' })
  listNav(@Query('menu') menu?: string) {
    return this.cms.listNav(menu);
  }

  @Post('navigation')
  @ApiOperation({ summary: 'Tambah item menu' })
  createNav(@Body() dto: CreateNavItemDto) {
    return this.cms.createNav(dto);
  }

  @Patch('navigation/:id')
  @ApiOperation({ summary: 'Perbarui item menu' })
  updateNav(@Param('id') id: string, @Body() dto: UpdateNavItemDto) {
    return this.cms.updateNav(id, dto);
  }

  @Delete('navigation/:id')
  @ApiOperation({ summary: 'Hapus item menu' })
  deleteNav(@Param('id') id: string) {
    return this.cms.deleteNav(id);
  }

  /* ------------------------------- Media ------------------------------ */

  @Get('media')
  @ApiQuery({ name: 'folder', required: false })
  @ApiOperation({ summary: 'Daftar media yang diunggah' })
  listMedia(@Query('folder') folder?: string) {
    return this.cms.listMedia(folder);
  }
}
