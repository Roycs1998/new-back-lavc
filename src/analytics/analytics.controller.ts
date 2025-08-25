import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { TimeRange } from 'src/common/enums/time-range.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard analytics',
    description:
      'Get comprehensive dashboard with KPIs and charts based on user permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: DashboardResponseDto,
  })
  @ApiQuery({ name: 'timeRange', enum: TimeRange, required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getDashboard(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<DashboardResponseDto> {
    return this.analyticsService.getDashboard(query, req.user);
  }

  @Get('events/:eventId')
  @ApiOperation({
    summary: 'Get event analytics',
    description: 'Get detailed analytics for a specific event',
  })
  @ApiResponse({
    status: 200,
    description: 'Event analytics retrieved successfully',
  })
  async getEventAnalytics(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getEventAnalytics(eventId, req.user);
  }

  @Get('companies/:companyId')
  @ApiOperation({
    summary: 'Get company analytics',
    description: 'Get detailed analytics for a specific company',
  })
  @ApiResponse({
    status: 200,
    description: 'Company analytics retrieved successfully',
  })
  @ApiQuery({ name: 'timeRange', enum: TimeRange, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getCompanyAnalytics(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getCompanyAnalytics(
      companyId,
      query,
      req.user,
    );
  }

  @Get('reports/revenue')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Get revenue report',
    description: 'Get detailed revenue report with breakdowns',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue report generated successfully',
  })
  async getRevenueReport(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.generateRevenueReport(query, req.user);
  }

  @Get('reports/tickets')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Get tickets report',
    description: 'Get detailed ticket sales report',
  })
  @ApiResponse({
    status: 200,
    description: 'Tickets report generated successfully',
  })
  async getTicketsReport(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.generateTicketsReport(query, req.user);
  }

  @Get('reports/events')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Get events report',
    description: 'Get detailed events performance report',
  })
  @ApiResponse({
    status: 200,
    description: 'Events report generated successfully',
  })
  async getEventsReport(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.generateEventsReport(query, req.user);
  }

  @Get('export/dashboard')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Export dashboard data',
    description: 'Export dashboard analytics as CSV/Excel',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data exported successfully',
  })
  @ApiQuery({ name: 'format', enum: ['csv', 'excel'], required: false })
  async exportDashboard(
    @Query() query: AnalyticsQueryDto & { format?: 'csv' | 'excel' },
    @Request() req: any,
  ) {
    return this.analyticsService.exportDashboard(query, req.user);
  }
}
