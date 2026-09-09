import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Automation Testing' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'automation-testing' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiPropertyOptional({ example: '🤖' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
