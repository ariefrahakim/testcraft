import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CourseStatus, Level } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

export class CourseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter slug kategori' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: Level })
  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @ApiPropertyOptional({ description: 'Harga minimum (IDR)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Harga maksimum (IDR)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Hanya kursus gratis' })
  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  free?: boolean;

  @ApiPropertyOptional({ description: 'Hanya kursus unggulan' })
  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    enum: ['popular', 'newest', 'rating', 'price_asc', 'price_desc'],
    default: 'popular',
  })
  @IsString()
  @IsOptional()
  sort?: 'popular' | 'newest' | 'rating' | 'price_asc' | 'price_desc' =
    'popular';

  @ApiPropertyOptional({
    enum: CourseStatus,
    description: 'Admin/instructor saja — publik selalu PUBLISHED',
  })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'playwright-zero-to-expert' })
  @IsString()
  @MinLength(3)
  slug!: string;

  @ApiProperty({ example: 'Playwright Automation Testing from Zero to Expert' })
  @IsString()
  @MinLength(5)
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  description!: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level!: Level;

  @ApiProperty({ description: 'ID kategori' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ description: 'ID profil instruktur' })
  @IsString()
  instructorId!: string;

  @ApiPropertyOptional({ example: 1250000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceIDR?: number;

  @ApiPropertyOptional({ example: 79 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceUSD?: number;

  @ApiPropertyOptional({ example: 2500000, description: 'Harga coret' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  compareAtIDR?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  compareAtUSD?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ example: '🎭' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewVideoUrl?: string;

  @ApiPropertyOptional({ example: 1920, description: 'Durasi total (menit)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  durationMin?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  outcomes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequisites?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetAudience?: string[];

  @ApiPropertyOptional({ enum: CourseStatus, default: CourseStatus.DRAFT })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBestseller?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoDescription?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

/** Dipakai halaman CMS "Pricing" untuk mengubah harga massal. */
export class UpdateCoursePricingDto {
  @ApiProperty({ example: 1350000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceIDR!: number;

  @ApiProperty({ example: 85 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceUSD!: number;

  @ApiPropertyOptional({ example: 2700000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  compareAtIDR?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  compareAtUSD?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;
}

export class BulkPricingItemDto extends UpdateCoursePricingDto {
  @ApiProperty()
  @IsString()
  courseId!: string;
}

export class BulkPricingDto {
  @ApiProperty({ type: [BulkPricingItemDto] })
  @IsArray()
  @Type(() => BulkPricingItemDto)
  items!: BulkPricingItemDto[];
}
