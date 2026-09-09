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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser, Public, Roles } from '../../common/decorators';
import { CoursesService } from './courses.service';
import {
  BulkPricingDto,
  CourseQueryDto,
  CreateCourseDto,
  UpdateCourseDto,
  UpdateCoursePricingDto,
} from './dto/course.dto';

const STAFF: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR];

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Daftar kursus (katalog publik)',
    description:
      'Mendukung filter kategori, level, rentang harga, pencarian teks, dan sorting. ' +
      'Publik hanya melihat kursus berstatus PUBLISHED.',
  })
  findAll(@Query() query: CourseQueryDto, @CurrentUser() user?: AuthUser) {
    const isStaff = !!user && STAFF.includes(user.role);
    return this.courses.findAll(query, isStaff);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Detail kursus beserta kurikulum' })
  @ApiParam({ name: 'slug', example: 'playwright-zero-to-expert' })
  findOne(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    const isStaff = !!user && STAFF.includes(user.role);
    return this.courses.findBySlug(slug, isStaff);
  }

  @Post()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat kursus baru' })
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perbarui kursus' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @Patch(':id/pricing')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ubah harga satu kursus',
    description: 'Dipakai halaman CMS → Pricing.',
  })
  updatePricing(@Param('id') id: string, @Body() dto: UpdateCoursePricingDto) {
    return this.courses.updatePricing(id, dto);
  }

  @Patch('pricing/bulk')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ubah harga banyak kursus sekaligus (transaksional)' })
  @ApiOkResponse({ schema: { example: { updated: 12 } } })
  bulkPricing(@Body() dto: BulkPricingDto) {
    return this.courses.bulkPricing(dto);
  }

  @Post(':id/refresh-stats')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hitung ulang rating / jumlah siswa / jumlah lesson' })
  refreshStats(@Param('id') id: string) {
    return this.courses.refreshStats(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Arsipkan kursus',
    description: 'Soft delete — status menjadi ARCHIVED, data pembelian tetap utuh.',
  })
  remove(@Param('id') id: string) {
    return this.courses.remove(id);
  }
}
