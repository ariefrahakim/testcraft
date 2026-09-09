import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Roles } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

export class RubricItemDto {
  @ApiProperty({ example: 'Kelengkapan test case' })
  @IsString()
  criterion!: string;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points!: number;
}

export class CreateAssignmentDto {
  @ApiProperty({ description: 'ID lesson tempat tugas dilampirkan' })
  @IsString()
  lessonId!: string;

  @ApiProperty({ example: 'Final Project — Framework Playwright' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ description: 'Instruksi pengerjaan untuk siswa' })
  @IsString()
  @MinLength(10)
  brief!: string;

  @ApiPropertyOptional({ default: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxPoints?: number;

  @ApiPropertyOptional({
    type: [RubricItemDto],
    description: 'Kriteria penilaian yang dilihat siswa maupun mentor',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricItemDto)
  @IsOptional()
  rubric?: RubricItemDto[];

  @ApiPropertyOptional({ description: 'Tenggat pengumpulan siswa' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brief?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxPoints?: number;

  @ApiPropertyOptional({ type: [RubricItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricItemDto)
  @IsOptional()
  rubric?: RubricItemDto[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Daftar tugas beserta hitungan submission per status. */
  async list(courseId?: string) {
    const rows = await this.prisma.assignment.findMany({
      where: courseId ? { lesson: { module: { courseId } } } : {},
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }],
      select: {
        id: true,
        title: true,
        brief: true,
        maxPoints: true,
        dueAt: true,
        rubric: true,
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: { title: true, course: { select: { id: true, title: true } } },
            },
          },
        },
        submissions: { select: { status: true } },
      },
    });

    return rows.map((a) => {
      const counts = a.submissions.reduce<Record<string, number>>((acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      }, {});
      const { submissions: _s, lesson, ...rest } = a;
      return {
        ...rest,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: lesson.module.title,
        courseId: lesson.module.course.id,
        courseTitle: lesson.module.course.title,
        totalSubmissions: a.submissions.length,
        pendingCount: counts.SUBMITTED ?? 0,
        gradedCount: counts.GRADED ?? 0,
      };
    });
  }

  create(dto: CreateAssignmentDto) {
    const { rubric, dueAt, ...rest } = dto;
    return this.prisma.assignment.create({
      data: {
        ...rest,
        rubric: (rubric ?? []) as unknown as Prisma.JsonArray,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
    });
  }

  update(id: string, dto: UpdateAssignmentDto) {
    const { rubric, dueAt, ...rest } = dto;
    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...rest,
        ...(rubric ? { rubric: rubric as unknown as Prisma.JsonArray } : {}),
        ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.assignment.delete({ where: { id } });
    return { ok: true };
  }

  /** Lesson yang belum punya tugas — untuk dropdown saat membuat tugas baru. */
  availableLessons() {
    return this.prisma.lesson.findMany({
      where: { assignment: null },
      orderBy: [{ module: { course: { title: 'asc' } } }, { order: 'asc' }],
      take: 300,
      select: {
        id: true,
        title: true,
        module: { select: { title: true, course: { select: { title: true } } } },
      },
    });
  }
}

@ApiTags('CMS (Admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('cms/assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  @ApiQuery({ name: 'courseId', required: false })
  @ApiOperation({
    summary: 'Daftar tugas beserta statistik penilaiannya',
    description:
      'Sumber tunggal konfigurasi tugas: instruksi, rubrik, poin maksimum, dan tenggat. ' +
      'Dipakai siswa (halaman Tugas & Nilai) dan mentor (antrian penilaian).',
  })
  list(@Query('courseId') courseId?: string) {
    return this.assignments.list(courseId);
  }

  @Get('available-lessons')
  @ApiOperation({ summary: 'Lesson yang belum memiliki tugas' })
  availableLessons() {
    return this.assignments.availableLessons();
  }

  @Post()
  @ApiOperation({ summary: 'Buat tugas baru pada sebuah lesson' })
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignments.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui instruksi, rubrik, poin, atau tenggat tugas' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignments.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus tugas beserta seluruh submission-nya' })
  remove(@Param('id') id: string) {
    return this.assignments.remove(id);
  }
}
