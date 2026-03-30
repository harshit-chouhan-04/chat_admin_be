import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardMetricsQueryDto } from './dtos/dashboard-metrics-query.dto';
import { DashboardService } from './providers/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({
    summary:
      'Get dashboard metrics (totals + period-over-period % change for the selected window)',
  })
  getMetrics(@Query() query: DashboardMetricsQueryDto) {
    return this.dashboardService.getMetrics(query);
  }

  @Get('conversations-per-day')
  @ApiOperation({
    summary:
      'Daily conversations count time series (formatted as { date: "Mar 1", count: n })',
  })
  getConversationsPerDay(@Query() query: DashboardMetricsQueryDto) {
    return this.dashboardService.getConversationsPerDay(query);
  }

  @Get('message-usage-over-time')
  @ApiOperation({
    summary:
      'Daily message usage time series (formatted as { date: "Mar 1", user: n, ai: n })',
  })
  getMessageUsageOverTime(@Query() query: DashboardMetricsQueryDto) {
    return this.dashboardService.getMessageUsageOverTime(query);
  }
}
