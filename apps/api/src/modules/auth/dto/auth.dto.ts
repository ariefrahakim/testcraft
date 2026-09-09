import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Nilai `message` sengaja diisi KODE pesan, bukan kalimat.
 * AllExceptionsFilter yang menerjemahkannya mengikuti `Accept-Language`,
 * sehingga pengguna tidak pernah melihat teks bawaan class-validator
 * seperti "email must be an email".
 */
export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsNotEmpty({ message: 'validation.name.required' })
  @IsString({ message: 'validation.name.required' })
  @MinLength(2, { message: 'validation.name.tooShort' })
  @MaxLength(80, { message: 'validation.name.tooShort' })
  name!: string;

  @ApiProperty({ example: 'budi@example.com' })
  @IsNotEmpty({ message: 'validation.email.required' })
  @IsEmail({}, { message: 'validation.email.invalid' })
  email!: string;

  @ApiProperty({
    example: 'Rahasia123',
    description: 'Min 8 karakter, mengandung huruf dan angka',
  })
  @IsNotEmpty({ message: 'validation.password.required' })
  @IsString({ message: 'validation.password.required' })
  @MinLength(8, { message: 'validation.password.tooShort' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'validation.password.weak' })
  password!: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@testcraft.id' })
  @IsNotEmpty({ message: 'validation.email.required' })
  @IsEmail({}, { message: 'validation.email.invalid' })
  email!: string;

  @ApiProperty({ example: 'Admin#12345' })
  @IsNotEmpty({ message: 'validation.password.required' })
  @IsString({ message: 'validation.password.required' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token dari /auth/login' })
  @IsNotEmpty({ message: 'auth.refreshInvalid' })
  @IsString({ message: 'auth.refreshInvalid' })
  refreshToken!: string;
}

export class AuthTokensDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ example: 900, description: 'Umur access token (detik)' })
  expiresIn!: number;
}

export class UserProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() phone?: string | null;
  @ApiProperty({
    enum: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT', 'CORPORATE_ADMIN'],
  })
  role!: string;
  @ApiPropertyOptional() avatarUrl?: string | null;
  @ApiProperty() xp!: number;
  @ApiProperty() level!: number;
  @ApiProperty() streakDays!: number;
  @ApiPropertyOptional() companyId?: string | null;
  @ApiProperty() createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserProfileDto }) user!: UserProfileDto;
  @ApiProperty({ type: AuthTokensDto }) tokens!: AuthTokensDto;
}
