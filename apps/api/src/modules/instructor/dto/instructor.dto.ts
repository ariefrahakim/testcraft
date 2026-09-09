import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * Query antrian penilaian. Filter tambahan wajib dideklarasikan di DTO —
 * ValidationPipe memakai forbidNonWhitelisted, jadi param yang tak dikenal ditolak.
 */
export class GradingQueueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SubmissionStatus, default: SubmissionStatus.SUBMITTED })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @ApiPropertyOptional({ description: 'Batasi ke satu kursus' })
  @IsString()
  @IsOptional()
  courseId?: string;
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 85, description: 'Nilai; dipotong ke maxPoints tugas' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  grade!: number;

  @ApiPropertyOptional({ example: 'Struktur test case sudah rapi, tambahkan negative case.' })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Bila true, status menjadi RETURNED agar siswa merevisi',
  })
  @IsBoolean()
  @IsOptional()
  returnForRevision?: boolean;
}
