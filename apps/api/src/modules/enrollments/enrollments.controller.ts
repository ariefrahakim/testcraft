import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EnrollmentsService } from './enrollments.service';

class EnrollDto {
  @ApiPropertyOptional({ description: 'ID kursus' })
  @IsString()
  courseId!: string;
}

class SubmitAssignmentDto {
  @ApiPropertyOptional({ description: 'Jawaban dalam HTML sederhana' })
  @IsString()
  @IsOptional()
  contentHtml?: string;

  @ApiPropertyOptional({ description: 'Potongan kode / tautan repositori' })
  @IsString()
  @IsOptional()
  codeSnippet?: string;

  @ApiPropertyOptional({ type: [String], description: 'URL lampiran' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];
}

class TrackProgressDto {
  @ApiPropertyOptional({ description: 'Tandai lesson selesai' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Posisi video terakhir (detik)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  resumeSecond?: number;

  @ApiPropertyOptional({ description: 'Total detik ditonton' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  watchedSec?: number;
}

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Kursus yang saya ikuti beserta progres' })
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.enrollments.listMine(userId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Daftar ke sebuah kursus',
    description:
      'Kursus berbayar menolak pendaftaran bila belum ada Payment berstatus PAID.',
  })
  enroll(@CurrentUser('id') userId: string, @Body() dto: EnrollDto) {
    return this.enrollments.enroll(userId, dto.courseId);
  }

  @Get('me/assignments')
  @ApiOperation({
    summary: 'Tugas dari semua kursus saya beserta status penilaiannya',
    description: 'Diurutkan dari tenggat terdekat. Dipakai halaman "Tugas & Nilai" siswa.',
  })
  myAssignments(@CurrentUser('id') userId: string) {
    return this.enrollments.myAssignments(userId);
  }

  @Post('assignments/:assignmentId/submit')
  @ApiOperation({
    summary: 'Kirim jawaban tugas',
    description:
      'Bila submission sebelumnya belum dinilai, jawaban diperbarui. Bila sudah dinilai, dibuat percobaan baru.',
  })
  submitAssignment(
    @CurrentUser('id') userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.enrollments.submitAssignment(userId, assignmentId, dto);
  }

  @Post('lessons/:lessonId/progress')
  @ApiOperation({ summary: 'Simpan progres belajar sebuah lesson' })
  track(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: TrackProgressDto,
  ) {
    return this.enrollments.trackProgress(userId, lessonId, dto);
  }
}
