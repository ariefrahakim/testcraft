import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CmsService } from './cms.service';

/**
 * Konten CMS versi publik — hanya baca, hanya yang sudah terbit/aktif.
 * Dikonsumsi oleh halaman-halaman marketing di apps/web.
 */
@ApiTags('Content (Public)')
@Public()
@Controller('content')
export class PublicContentController {
  constructor(private readonly cms: CmsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Pengaturan situs untuk render brand & kurs' })
  settings() {
    return this.cms.getSettings();
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Halaman terbit beserta blok kontennya' })
  page(@Param('slug') slug: string) {
    return this.cms.getPage(slug, true);
  }

  @Get('banners')
  @ApiOperation({ summary: 'Banner aktif pada rentang tanggal saat ini' })
  banners() {
    return this.cms.listBanners(true);
  }

  @Get('pricing-plans')
  @ApiOperation({ summary: 'Paket harga aktif' })
  plans() {
    return this.cms.listPlans(true);
  }

  @Get('testimonials')
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiOperation({ summary: 'Testimoni (opsional hanya yang unggulan)' })
  testimonials(@Query('featured') featured?: string) {
    return this.cms.listTestimonials(featured === 'true');
  }

  @Get('faqs')
  @ApiOperation({ summary: 'FAQ yang terbit' })
  faqs() {
    return this.cms.listFaqs(true);
  }

  @Get('navigation')
  @ApiQuery({ name: 'menu', required: false, example: 'header' })
  @ApiOperation({ summary: 'Item menu yang terlihat' })
  navigation(@Query('menu') menu?: string) {
    return this.cms.listNav(menu);
  }
}
