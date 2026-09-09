import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../../common/decorators';
import { GradeSubmissionDto, GradingQueueQueryDto } from './dto/instructor.dto';
import { InstructorService } from './instructor.service';

@ApiTags('Instructor Workspace')
@ApiBearerAuth()
@Roles(Role.INSTRUCTOR, Role.ADMIN)
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructor: InstructorService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Kursus yang saya ampu' })
  courses(@CurrentUser() user: AuthUser) {
    return this.instructor.myCourses(user.id, user.role);
  }

  @Get('submissions')
  @ApiOperation({
    summary: 'Antrian penilaian tugas',
    description:
      'Default menampilkan submission berstatus SUBMITTED, diurutkan dari yang paling lama menunggu.',
  })
  submissions(@CurrentUser() user: AuthUser, @Query() query: GradingQueueQueryDto) {
    return this.instructor.gradingQueue(
      user.id,
      user.role,
      query,
      query.status,
      query.courseId,
    );
  }

  @Get('submissions/pending-summary')
  @ApiOperation({
    summary: 'Ringkasan tugas yang belum dinilai per assignment',
    description:
      'Diurutkan dari deadline terdekat — dipakai banner "perlu tindakan" di dashboard instruktur.',
  })
  pendingSummary(@CurrentUser() user: AuthUser) {
    return this.instructor.pendingSummary(user.id, user.role);
  }

  @Patch('submissions/:id/grade')
  @ApiOperation({ summary: 'Beri nilai & umpan balik pada sebuah submission' })
  grade(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.instructor.grade(user.id, user.role, id, dto);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Ringkasan pendapatan dari penjualan kursus saya' })
  payouts(@CurrentUser() user: AuthUser) {
    return this.instructor.payouts(user.id, user.role);
  }
}
