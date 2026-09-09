import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Rizky Ananda' })
  @IsNotEmpty({ message: 'validation.name.required' })
  @IsString({ message: 'validation.name.required' })
  @MinLength(2, { message: 'validation.name.tooShort' })
  name!: string;

  // Minimal salah satu dari email atau telepon wajib ada.
  //
  // `@IsOptional()` sengaja TIDAK dipakai di sini: dekorator itu melewati
  // seluruh validasi ketika nilainya undefined, sehingga kiriman tanpa email
  // DAN tanpa telepon akan lolos. `@ValidateIf` sudah cukup — aturan hanya
  // dijalankan ketika field pasangannya kosong.
  @ApiPropertyOptional({ example: 'rizky@example.com' })
  @ValidateIf((o: CreateLeadDto) => !o.phone)
  @IsEmail({}, { message: 'validation.contact.required' })
  email?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @ValidateIf((o: CreateLeadDto) => !o.email)
  @IsNotEmpty({ message: 'validation.contact.required' })
  @IsString({ message: 'validation.contact.required' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Playwright Automation' })
  @IsString()
  @IsOptional()
  interest?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ default: 'landing' })
  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateLeadDto {
  @ApiProperty()
  @IsBoolean()
  handled!: boolean;
}
