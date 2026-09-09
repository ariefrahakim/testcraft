import { Controller, Get, Injectable, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    steps: {
      orderBy: { order: 'asc' as const },
      select: {
        order: true,
        course: {
          select: {
            slug: true,
            title: true,
            icon: true,
            durationMin: true,
            level: true,
            priceIDR: true,
          },
        },
      },
    },
  };

  findAll() {
    return this.prisma.learningPath.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
      include: this.include,
    });
  }

  findOne(slug: string) {
    return this.prisma.learningPath.findUniqueOrThrow({
      where: { slug },
      include: this.include,
    });
  }
}

@ApiTags('Learning Paths')
@Public()
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly paths: LearningPathsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar jalur belajar beserta urutan kursusnya' })
  findAll() {
    return this.paths.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detail satu jalur belajar' })
  findOne(@Param('slug') slug: string) {
    return this.paths.findOne(slug);
  }
}
