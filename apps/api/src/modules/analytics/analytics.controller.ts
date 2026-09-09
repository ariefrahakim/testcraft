import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Ringkasan KPI untuk dashboard admin' })
  overview() {
    return this.analytics.overview();
  }

  @Get('top-courses')
  @ApiOperation({ summary: '10 kursus dengan peserta terbanyak' })
  topCourses() {
    return this.analytics.topCourses();
  }

  @Get('revenue-by-month')
  @ApiOperation({ summary: 'Pendapatan 12 bulan terakhir' })
  revenue() {
    return this.analytics.revenueByMonth();
  }
}
