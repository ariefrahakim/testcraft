import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BlockType, ContentStatus, DiscountType, PlanInterval } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/* ---------------------------- Site settings ---------------------------- */

export class SiteSettingsDto {
  @ApiProperty({ example: 'TestCraft Indonesia' })
  @IsString()
  brandName!: string;

  @ApiProperty({ example: 'Learn. Build. Automate.' })
  @IsString()
  tagline!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @ApiProperty({ example: '#2563EB' })
  @IsString()
  primaryColor!: string;

  @ApiProperty({ example: 'testcraftindonesia@gmail.com' })
  @IsString()
  contactEmail!: string;

  @ApiProperty({ example: '6282395568743' })
  @IsString()
  whatsapp!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: { linkedin: 'https://linkedin.com/company/testcraft', youtube: '' },
  })
  @IsObject()
  @IsOptional()
  socials?: Record<string, string>;

  @ApiProperty({ enum: ['IDR', 'USD'], example: 'IDR' })
  @IsString()
  defaultCurrency!: 'IDR' | 'USD';

  @ApiProperty({ example: 16000, description: 'Kurs 1 USD dalam IDR' })
  @IsNumber()
  @Min(1)
  usdRate!: number;

  @ApiProperty({ example: 11, description: 'PPN dalam persen' })
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  maintenanceMode!: boolean;
}

/* -------------------------------- Pages -------------------------------- */

export class ContentBlockDto {
  @ApiPropertyOptional({ description: 'Kosongkan untuk blok baru' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ enum: BlockType })
  @IsEnum(BlockType)
  type!: BlockType;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @ApiProperty({
    description: 'Payload blok, bentuknya bergantung pada `type`',
    example: {
      heading: 'Kuasai Software Testing',
      subheading: 'Dari manual sampai AI-powered automation',
      ctaLabel: 'Lihat Katalog',
      ctaUrl: '/catalog',
    },
  })
  @IsObject()
  data!: Record<string, unknown>;
}

export class CreatePageDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ example: 'Beranda' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ogImageUrl?: string;

  @ApiPropertyOptional({ type: [ContentBlockDto] })
  @IsArray()
  @Type(() => ContentBlockDto)
  @IsOptional()
  blocks?: ContentBlockDto[];
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}

/* ------------------------------- Banners ------------------------------- */

export class CreateBannerDto {
  @ApiProperty({ example: 'top-promo' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'Diskon 50% semua kelas automation' })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ example: 'Ambil Promo' })
  @IsString()
  @IsOptional()
  ctaLabel?: string;

  @ApiPropertyOptional({ example: '/catalog' })
  @IsString()
  @IsOptional()
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ['info', 'promo', 'warning'], default: 'info' })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

/* ---------------------------- Pricing plans ---------------------------- */

export class CreatePricingPlanDto {
  @ApiProperty({ example: 'pro-bootcamp' })
  @IsString()
  slug!: string;

  @ApiProperty({ example: 'Pro Bootcamp' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 4990000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceIDR!: number;

  @ApiProperty({ example: 312 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceUSD!: number;

  @ApiPropertyOptional({ example: 7990000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  compareAtIDR?: number;

  @ApiPropertyOptional({ enum: PlanInterval, default: PlanInterval.ONE_TIME })
  @IsEnum(PlanInterval)
  @IsOptional()
  interval?: PlanInterval;

  @ApiPropertyOptional({ type: [String], example: ['Akses semua kelas', 'Mentoring 1-on-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  highlighted?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;
}

export class UpdatePricingPlanDto extends PartialType(CreatePricingPlanDto) {}

/* ------------------------------- Coupons ------------------------------- */

export class CreateCouponDto {
  @ApiProperty({ example: 'MERDEKA50' })
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENT })
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @ApiProperty({ example: 50, description: 'Persen (0-100) atau nominal IDR' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsesPerUser?: number;

  @ApiPropertyOptional({ example: 500000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPurchaseIDR?: number;

  @ApiPropertyOptional({ type: [String], description: 'Kosong = berlaku semua kursus' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  appliesToCourseIds?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

/* --------------------------- Testimonials/FAQ -------------------------- */

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Rizky Ananda' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'QA Engineer' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'Tokopedia' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  quote!: string;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

export class CreateFaqDto {
  @ApiProperty({ example: 'Apakah sertifikatnya diakui industri?' })
  @IsString()
  question!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiPropertyOptional({ default: 'general' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

/* ------------------------------ Navigation ----------------------------- */

export class CreateNavItemDto {
  @ApiProperty({ example: 'header' })
  @IsString()
  menu!: string;

  @ApiProperty({ example: 'Katalog' })
  @IsString()
  label!: string;

  @ApiProperty({ example: '/catalog' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  visible?: boolean;
}

export class UpdateNavItemDto extends PartialType(CreateNavItemDto) {}
