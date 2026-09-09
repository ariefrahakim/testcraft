import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, PaymentProvider, PaymentStatus } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** Filter daftar transaksi. Semua param query harus dideklarasikan di sini. */
export class PaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}

export class CheckoutDto {
  @ApiProperty({ type: [String], description: 'Daftar ID kursus yang dibeli' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  courseIds!: string[];

  @ApiPropertyOptional({ enum: PaymentProvider, default: PaymentProvider.MIDTRANS })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @ApiPropertyOptional({ enum: Currency, default: Currency.IDR })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({ example: 'MERDEKA50' })
  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class WebhookDto {
  @ApiProperty({ example: 'INV-2026-000001' })
  @IsString()
  invoiceNo!: string;

  @ApiPropertyOptional({ description: 'ID transaksi di gateway' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ example: 'settlement' })
  @IsString()
  @IsOptional()
  transactionStatus?: string;
}
