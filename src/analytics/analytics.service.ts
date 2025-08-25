import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  DashboardResponseDto,
  KPICard,
  ChartData,
  MetricDataPoint,
} from './dto/dashboard-response.dto';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { PaymentTransaction } from 'src/payments/entities/payment.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Event } from 'src/events/entities/event.entity';
import { TimeRange } from 'src/common/enums/time-range.enum';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(PaymentTransaction.name)
    private paymentModel: Model<PaymentTransaction>,
  ) {}

  async getDashboard(
    query: AnalyticsQueryDto,
    user: any,
  ): Promise<DashboardResponseDto> {
    this.logger.log(
      `Getting dashboard for user: ${user.id}, role: ${user.role}`,
    );

    const dateRange = this.getDateRange(query);
    const companyFilter = this.getCompanyFilter(user, query.companyId);

    const [kpis, charts] = await Promise.all([
      this.generateKPIs(dateRange, companyFilter),
      this.generateCharts(dateRange, companyFilter, user.role),
    ]);

    return {
      kpis,
      charts,
      lastUpdated: new Date(),
      dateRange: {
        startDate: dateRange.start,
        endDate: dateRange.end,
        period: this.getPeriodLabel(query.timeRange),
      },
    };
  }

  async generateRevenueReport(query: AnalyticsQueryDto, user: any) {
    const dateRange = this.getDateRange(query);
    const companyFilter = this.getCompanyFilter(user, query.companyId);

    const [
      totalRevenue,
      revenueByPeriod,
      revenueByEvent,
      revenueByTicketType,
      paymentMethods,
    ] = await Promise.all([
      this.getTotalRevenue(dateRange, companyFilter),
      this.getRevenueByPeriod(dateRange, companyFilter),
      this.getRevenueByEvent(dateRange, companyFilter),
      this.getRevenueByTicketType(dateRange, companyFilter),
      this.getPaymentMethodBreakdown(dateRange, companyFilter),
    ]);

    return {
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: totalRevenue[0]?.avg || 0,
        totalTransactions: totalRevenue[0]?.count || 0,
      },
      breakdown: {
        byPeriod: revenueByPeriod,
        byEvent: revenueByEvent,
        byTicketType: revenueByTicketType,
        byPaymentMethod: paymentMethods,
      },
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };
  }

  async generateTicketsReport(query: AnalyticsQueryDto, user: any) {
    const dateRange = this.getDateRange(query);
    const companyFilter = this.getCompanyFilter(user, query.companyId);

    const [ticketsSummary, ticketsByStatus, ticketsByEvent, attendanceStats] =
      await Promise.all([
        this.getTicketsSummary(dateRange, companyFilter),
        this.getTicketsByStatus(dateRange, companyFilter),
        this.getTicketsByEvent(dateRange, companyFilter),
        this.getAttendanceStats(dateRange, companyFilter),
      ]);

    return {
      summary: ticketsSummary,
      breakdown: {
        byStatus: ticketsByStatus,
        byEvent: ticketsByEvent,
      },
      attendance: attendanceStats,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };
  }

  async generateEventsReport(query: AnalyticsQueryDto, user: any) {
    const dateRange = this.getDateRange(query);
    const companyFilter = this.getCompanyFilter(user, query.companyId);

    const [
      eventsSummary,
      eventsByStatus,
      topPerformingEvents,
      eventPerformanceMetrics,
    ] = await Promise.all([
      this.getEventsSummary(dateRange, companyFilter),
      this.getEventsByStatus(dateRange, companyFilter),
      this.getTopPerformingEvents(dateRange, companyFilter),
      this.getEventPerformanceMetrics(dateRange, companyFilter),
    ]);

    return {
      summary: eventsSummary,
      breakdown: {
        byStatus: eventsByStatus,
        topPerforming: topPerformingEvents,
      },
      performance: eventPerformanceMetrics,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };
  }

  async exportDashboard(
    query: AnalyticsQueryDto & { format?: 'csv' | 'excel' },
    user: any,
  ) {
    const dashboard = await this.getDashboard(query, user);
    const format = query.format || 'csv';

    // Convert dashboard data to export format
    const exportData = this.prepareDashboardExport(dashboard);

    if (format === 'excel') {
      return this.generateExcelExport(exportData);
    } else {
      return this.generateCSVExport(exportData);
    }
  }

  private prepareDashboardExport(dashboard: DashboardResponseDto) {
    return {
      kpis: dashboard.kpis.map((kpi) => ({
        metric: kpi.title,
        value: kpi.value,
        change: kpi.change,
        format: kpi.format,
      })),
      charts: dashboard.charts.map((chart) => ({
        title: chart.title,
        type: chart.type,
        dataPoints: chart.data.length,
      })),
    };
  }

  private generateCSVExport(data: any) {
    // Implementation for CSV export
    // This would use a CSV library to generate the export
    return {
      filename: `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`,
      content: 'CSV content here',
      mimeType: 'text/csv',
    };
  }

  private generateExcelExport(data: any) {
    // Implementation for Excel export
    // This would use a library like xlsx to generate the export
    return {
      filename: `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      content: 'Excel content here',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async getTotalRevenue(dateRange: any, companyFilter: any) {
    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          avg: { $avg: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  private async getRevenueByPeriod(dateRange: any, companyFilter: any) {
    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
    ]);
  }

  private async getRevenueByEvent(dateRange: any, companyFilter: any) {
    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'metadata.eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event._id',
          eventTitle: { $first: '$event.title' },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  private async generateKPIs(
    dateRange: any,
    companyFilter: any,
  ): Promise<KPICard[]> {
    const [revenueData, ticketsData, eventsData, attendeesData] =
      await Promise.all([
        this.getRevenueKPI(dateRange, companyFilter),
        this.getTicketsSoldKPI(dateRange, companyFilter),
        this.getEventsKPI(dateRange, companyFilter),
        this.getAttendeesKPI(dateRange, companyFilter),
      ]);

    return [revenueData, ticketsData, eventsData, attendeesData];
  }

  private async getRevenueKPI(
    dateRange: any,
    companyFilter: any,
  ): Promise<KPICard> {
    const currentRevenue = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousRevenue = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const current = currentRevenue[0]?.total || 0;
    const previous = previousRevenue[0]?.total || 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      title: 'Total Revenue',
      value: current,
      change: Math.round(change * 100) / 100,
      format: 'currency',
      icon: 'dollar-sign',
      color: current >= previous ? 'green' : 'red',
    };
  }

  private async getTicketsSoldKPI(
    dateRange: any,
    companyFilter: any,
  ): Promise<KPICard> {
    const currentTickets = await this.ticketModel.countDocuments({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $ne: 'cancelled' },
      ...companyFilter,
    });

    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousTickets = await this.ticketModel.countDocuments({
      createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
      status: { $ne: 'cancelled' },
      ...companyFilter,
    });

    const change =
      previousTickets > 0
        ? ((currentTickets - previousTickets) / previousTickets) * 100
        : 0;

    return {
      title: 'Tickets Sold',
      value: currentTickets,
      change: Math.round(change * 100) / 100,
      format: 'number',
      icon: 'ticket',
      color: currentTickets >= previousTickets ? 'green' : 'red',
    };
  }

  private async getEventsKPI(
    dateRange: any,
    companyFilter: any,
  ): Promise<KPICard> {
    const currentEvents = await this.eventModel.countDocuments({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $ne: 'deleted' },
      ...companyFilter,
    });

    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousEvents = await this.eventModel.countDocuments({
      createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
      status: { $ne: 'deleted' },
      ...companyFilter,
    });

    const change =
      previousEvents > 0
        ? ((currentEvents - previousEvents) / previousEvents) * 100
        : 0;

    return {
      title: 'Events Created',
      value: currentEvents,
      change: Math.round(change * 100) / 100,
      format: 'number',
      icon: 'calendar',
      color: currentEvents >= previousEvents ? 'green' : 'red',
    };
  }

  private async getAttendeesKPI(
    dateRange: any,
    companyFilter: any,
  ): Promise<KPICard> {
    const attendeesData = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ['active', 'used'] },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: '$attendeeEmail',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          uniqueAttendees: { $sum: 1 },
        },
      },
    ]);

    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousAttendeesData = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
          status: { $in: ['active', 'used'] },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: '$attendeeEmail',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          uniqueAttendees: { $sum: 1 },
        },
      },
    ]);

    const current = attendeesData[0]?.uniqueAttendees || 0;
    const previous = previousAttendeesData[0]?.uniqueAttendees || 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      title: 'Unique Attendees',
      value: current,
      change: Math.round(change * 100) / 100,
      format: 'number',
      icon: 'users',
      color: current >= previous ? 'green' : 'red',
    };
  }

  private async generateCharts(
    dateRange: any,
    companyFilter: any,
    userRole: string,
  ): Promise<ChartData[]> {
    const charts: ChartData[] = [];

    charts.push(await this.getRevenueChart(dateRange, companyFilter));

    charts.push(await this.getTicketsSoldChart(dateRange, companyFilter));

    charts.push(await this.getEventStatusChart(dateRange, companyFilter));

    charts.push(await this.getTopEventsChart(dateRange, companyFilter));

    if (userRole === UserRole.PLATFORM_ADMIN) {
      charts.push(await this.getCompanyPerformanceChart(dateRange));
    }

    return charts;
  }

  private async getRevenueChart(
    dateRange: any,
    companyFilter: any,
  ): Promise<ChartData> {
    const revenueByDay = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    const data: MetricDataPoint[] = revenueByDay.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      value: item.revenue,
    }));

    return {
      title: 'Revenue Over Time',
      type: 'line',
      data,
    };
  }

  private async getTicketsSoldChart(
    dateRange: any,
    companyFilter: any,
  ): Promise<ChartData> {
    const ticketsByDay = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'cancelled' },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          tickets: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    const data: MetricDataPoint[] = ticketsByDay.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      value: item.tickets,
    }));

    return {
      title: 'Tickets Sold Over Time',
      type: 'bar',
      data,
    };
  }

  private async getEventStatusChart(
    dateRange: any,
    companyFilter: any,
  ): Promise<ChartData> {
    const statusData = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const data: MetricDataPoint[] = statusData.map((item) => ({
      date: item._id,
      value: item.count,
      label: this.capitalizeFirst(item._id),
    }));

    return {
      title: 'Events by Status',
      type: 'doughnut',
      data,
    };
  }

  private async getTopEventsChart(
    dateRange: any,
    companyFilter: any,
  ): Promise<ChartData> {
    const topEvents = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'cancelled' },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $group: {
          _id: '$eventId',
          eventTitle: { $first: '$event.title' },
          ticketsSold: { $sum: 1 },
        },
      },
      {
        $sort: { ticketsSold: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const data: MetricDataPoint[] = topEvents.map((item) => ({
      date: item.eventTitle,
      value: item.ticketsSold,
      label: `${item.ticketsSold} tickets`,
    }));

    return {
      title: 'Top 5 Events by Tickets Sold',
      type: 'bar',
      data,
    };
  }

  private async getCompanyPerformanceChart(dateRange: any): Promise<ChartData> {
    const companyPerformance = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'metadata.eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'event.companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $unwind: '$company',
      },
      {
        $group: {
          _id: '$company._id',
          companyName: { $first: '$company.name' },
          revenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const data: MetricDataPoint[] = companyPerformance.map((item) => ({
      date: item.companyName,
      value: item.revenue,
      label: `S/ ${item.revenue.toFixed(2)}`,
    }));

    return {
      title: 'Top Companies by Revenue',
      type: 'bar',
      data,
    };
  }

  async getEventAnalytics(eventId: string, user: any) {
    this.logger.log(`Getting analytics for event: ${eventId}`);

    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (
      user.role === UserRole.COMPANY_ADMIN &&
      event.companyId.toString() !== user.companyId
    ) {
      throw new Error('Unauthorized');
    }

    const [ticketStats, revenueStats, attendeeStats, timelineData] =
      await Promise.all([
        this.getEventTicketStats(eventId),
        this.getEventRevenueStats(eventId),
        this.getEventAttendeeStats(eventId),
        this.getEventTimelineData(eventId),
      ]);

    return {
      event: {
        id: event._id,
        title: event.title,
        eventStatus: event.eventStatus,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      tickets: ticketStats,
      revenue: revenueStats,
      attendees: attendeeStats,
      timeline: timelineData,
    };
  }

  private async getEventTicketStats(eventId: string) {
    const [totalTickets, soldTickets, usedTickets, cancelledTickets] =
      await Promise.all([
        this.ticketModel.countDocuments({ eventId }),
        this.ticketModel.countDocuments({
          eventId,
          status: { $in: ['active', 'used'] },
        }),
        this.ticketModel.countDocuments({ eventId, status: 'used' }),
        this.ticketModel.countDocuments({ eventId, status: 'cancelled' }),
      ]);

    const availableTickets = totalTickets - soldTickets - cancelledTickets;

    return {
      total: totalTickets,
      sold: soldTickets,
      used: usedTickets,
      available: availableTickets,
      cancelled: cancelledTickets,
      attendanceRate: soldTickets > 0 ? (usedTickets / soldTickets) * 100 : 0,
    };
  }

  private async getEventRevenueStats(eventId: string) {
    const revenueData = await this.paymentModel.aggregate([
      {
        $match: {
          'metadata.eventId': eventId,
          status: 'success',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageOrderValue: { $avg: '$amount' },
        },
      },
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
    };

    return {
      total: revenue.totalRevenue,
      transactions: revenue.totalTransactions,
      averageOrderValue: revenue.averageOrderValue,
    };
  }

  private async getEventAttendeeStats(eventId: string) {
    const attendeeData = await this.ticketModel.aggregate([
      {
        $match: {
          eventId,
          status: { $in: ['active', 'used'] },
        },
      },
      {
        $group: {
          _id: '$attendeeEmail',
          tickets: { $sum: 1 },
          name: { $first: '$attendeeName' },
        },
      },
      {
        $group: {
          _id: null,
          uniqueAttendees: { $sum: 1 },
          totalTickets: { $sum: '$tickets' },
        },
      },
    ]);

    const stats = attendeeData[0] || { uniqueAttendees: 0, totalTickets: 0 };

    return {
      unique: stats.uniqueAttendees,
      totalTickets: stats.totalTickets,
      averageTicketsPerAttendee:
        stats.uniqueAttendees > 0
          ? stats.totalTickets / stats.uniqueAttendees
          : 0,
    };
  }

  private async getEventTimelineData(eventId: string) {
    const salesData = await this.ticketModel.aggregate([
      {
        $match: {
          eventId,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          tickets: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    return salesData.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      tickets: item.tickets,
    }));
  }

  async getCompanyAnalytics(
    companyId: string,
    query: AnalyticsQueryDto,
    user: any,
  ) {
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== companyId) {
      throw new Error('Unauthorized');
    }

    const dateRange = this.getDateRange(query);

    const [overview, events, speakers, performance] = await Promise.all([
      this.getCompanyOverview(companyId, dateRange),
      this.getCompanyEventStats(companyId, dateRange),
      this.getCompanySpeakerStats(companyId, dateRange),
      this.getCompanyPerformanceStats(companyId, dateRange),
    ]);

    return {
      overview,
      events,
      speakers,
      performance,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };
  }

  private async getCompanyOverview(companyId: string, dateRange: any) {
    const [totalEvents, totalRevenue, totalTicketsSold, activeEvents] =
      await Promise.all([
        this.eventModel.countDocuments({
          companyId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
        }),
        this.paymentModel.aggregate([
          {
            $lookup: {
              from: 'events',
              localField: 'metadata.eventId',
              foreignField: '_id',
              as: 'event',
            },
          },
          {
            $unwind: '$event',
          },
          {
            $match: {
              'event.companyId': companyId,
              status: 'success',
              createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]),
        this.ticketModel.countDocuments({
          companyId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'cancelled' },
        }),
        this.eventModel.countDocuments({
          companyId,
          status: 'published',
          endDate: { $gte: new Date() },
        }),
      ]);

    return {
      totalEvents,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalTicketsSold,
      activeEvents,
    };
  }

  private async getCompanyEventStats(companyId: string, dateRange: any) {
    return this.eventModel.aggregate([
      {
        $match: {
          companyId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  private async getCompanySpeakerStats(companyId: string, dateRange: any) {
    // This would require the Speaker model to be imported
    // For now, returning a placeholder
    return {
      total: 0,
      active: 0,
      mostBooked: [],
    };
  }

  private async getCompanyPerformanceStats(companyId: string, dateRange: any) {
    const monthlyData = await this.paymentModel.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'metadata.eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $match: {
          'event.companyId': companyId,
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    return monthlyData.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.revenue,
      transactions: item.transactions,
    }));
  }

  private async getRevenueByTicketType(dateRange: any, companyFilter: any) {
    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'metadata.ticketIds',
          foreignField: '_id',
          as: 'tickets',
        },
      },
      { $unwind: '$tickets' },
      {
        $lookup: {
          from: 'tickettypes',
          localField: 'tickets.ticketTypeId',
          foreignField: '_id',
          as: 'ticketType',
        },
      },
      { $unwind: '$ticketType' },
      {
        $group: {
          _id: '$ticketType._id',
          ticketTypeName: { $first: '$ticketType.name' },
          revenue: { $sum: '$amount' },
          ticketsSold: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  private async getPaymentMethodBreakdown(dateRange: any, companyFilter: any) {
    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  private async getTicketsSummary(dateRange: any, companyFilter: any) {
    const summary = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          activeTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          usedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] },
          },
          cancelledTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          transferredTickets: {
            $sum: {
              $cond: [{ $ne: ['$originalBuyerId', '$currentOwnerId'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = summary[0] || {
      totalTickets: 0,
      activeTickets: 0,
      usedTickets: 0,
      cancelledTickets: 0,
      transferredTickets: 0,
    };

    return {
      ...result,
      attendanceRate:
        result.activeTickets > 0
          ? (result.usedTickets / result.activeTickets) * 100
          : 0,
      cancellationRate:
        result.totalTickets > 0
          ? (result.cancelledTickets / result.totalTickets) * 100
          : 0,
      transferRate:
        result.totalTickets > 0
          ? (result.transferredTickets / result.totalTickets) * 100
          : 0,
    };
  }

  private async getTicketsByStatus(dateRange: any, companyFilter: any) {
    return this.ticketModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            ...companyFilter,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            percentage: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .then((results) => {
        const total = results.reduce((sum, item) => sum + item.count, 0);
        return results.map((item) => ({
          ...item,
          percentage:
            total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
        }));
      });
  }

  private async getTicketsByEvent(dateRange: any, companyFilter: any) {
    return this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$eventId',
          eventTitle: { $first: '$event.title' },
          eventDate: { $first: '$event.startDate' },
          totalTickets: { $sum: 1 },
          activeTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          usedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] },
          },
          revenue: {
            $sum: { $multiply: ['$price', 1] },
          },
        },
      },
      { $sort: { totalTickets: -1 } },
    ]);
  }

  private async getAttendanceStats(dateRange: any, companyFilter: any) {
    const attendanceData = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ['active', 'used'] },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$eventId',
          eventTitle: { $first: '$event.title' },
          eventDate: { $first: '$event.startDate' },
          totalTickets: { $sum: 1 },
          attendedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] },
          },
          uniqueAttendees: { $addToSet: '$attendeeEmail' },
        },
      },
      {
        $project: {
          eventTitle: 1,
          eventDate: 1,
          totalTickets: 1,
          attendedTickets: 1,
          uniqueAttendeesCount: { $size: '$uniqueAttendees' },
          attendanceRate: {
            $cond: [
              { $gt: ['$totalTickets', 0] },
              {
                $multiply: [
                  { $divide: ['$attendedTickets', '$totalTickets'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { attendanceRate: -1 } },
    ]);

    const overallStats = await this.ticketModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ['active', 'used'] },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          attendedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] },
          },
          uniqueAttendees: { $addToSet: '$attendeeEmail' },
        },
      },
      {
        $project: {
          totalTickets: 1,
          attendedTickets: 1,
          uniqueAttendeesCount: { $size: '$uniqueAttendees' },
          overallAttendanceRate: {
            $cond: [
              { $gt: ['$totalTickets', 0] },
              {
                $multiply: [
                  { $divide: ['$attendedTickets', '$totalTickets'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    return {
      overall: overallStats[0] || {
        totalTickets: 0,
        attendedTickets: 0,
        uniqueAttendeesCount: 0,
        overallAttendanceRate: 0,
      },
      byEvent: attendanceData,
    };
  }

  private async getEventsSummary(dateRange: any, companyFilter: any) {
    const summary = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
          ...companyFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          draftEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
          publishedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
          completedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          upcomingEvents: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'published'] },
                    { $gte: ['$startDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = summary[0] || {
      totalEvents: 0,
      draftEvents: 0,
      publishedEvents: 0,
      completedEvents: 0,
      cancelledEvents: 0,
      upcomingEvents: 0,
    };

    return {
      ...result,
      completionRate:
        result.totalEvents > 0
          ? (result.completedEvents / result.totalEvents) * 100
          : 0,
      cancellationRate:
        result.totalEvents > 0
          ? (result.cancelledEvents / result.totalEvents) * 100
          : 0,
      activeEventsRate:
        result.totalEvents > 0
          ? (result.publishedEvents / result.totalEvents) * 100
          : 0,
    };
  }

  private async getEventsByStatus(dateRange: any, companyFilter: any) {
    return this.eventModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            status: { $ne: 'deleted' },
            ...companyFilter,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            events: {
              $push: {
                id: '$_id',
                title: '$title',
                startDate: '$startDate',
                endDate: '$endDate',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ])
      .then((results) => {
        const total = results.reduce((sum, item) => sum + item.count, 0);
        return results.map((item) => ({
          status: item._id,
          count: item.count,
          percentage:
            total > 0 ? Math.round((item.count / total) * 100 * 100) / 100 : 0,
          events: item.events.slice(0, 5), // Limit to top 5 events per status
        }));
      });
  }

  private async getTopPerformingEvents(dateRange: any, companyFilter: any) {
    return this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets',
        },
      },
      {
        $lookup: {
          from: 'paymenttransactions',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$metadata.eventId', '$eventId'] },
                status: 'success',
              },
            },
          ],
          as: 'payments',
        },
      },
      {
        $project: {
          title: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          ticketsSold: {
            $size: {
              $filter: {
                input: '$tickets',
                cond: { $ne: ['$this.status', 'cancelled'] },
              },
            },
          },
          revenue: {
            $sum: '$payments.amount',
          },
          attendanceRate: {
            $cond: [
              { $gt: [{ $size: '$tickets' }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$tickets',
                            cond: { $eq: ['$this.status', 'used'] },
                          },
                        },
                      },
                      {
                        $size: {
                          $filter: {
                            input: '$tickets',
                            cond: { $ne: ['$this.status', 'cancelled'] },
                          },
                        },
                      },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
  }

  private async getEventPerformanceMetrics(dateRange: any, companyFilter: any) {
    const performanceData = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: 'deleted' },
          ...companyFilter,
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets',
        },
      },
      {
        $lookup: {
          from: 'paymenttransactions',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$metadata.eventId', '$eventId'] },
                status: 'success',
              },
            },
          ],
          as: 'payments',
        },
      },
      {
        $project: {
          title: 1,
          capacity: 1,
          startDate: 1,
          ticketsSold: {
            $size: {
              $filter: {
                input: '$tickets',
                cond: { $ne: ['$this.status', 'cancelled'] },
              },
            },
          },
          revenue: { $sum: '$payments.amount' },
          transactions: { $size: '$payments' },
        },
      },
      {
        $project: {
          title: 1,
          capacity: 1,
          startDate: 1,
          ticketsSold: 1,
          revenue: 1,
          transactions: 1,
          occupancyRate: {
            $cond: [
              { $gt: ['$capacity', 0] },
              { $multiply: [{ $divide: ['$ticketsSold', '$capacity'] }, 100] },
              0,
            ],
          },
          revenuePerTicket: {
            $cond: [
              { $gt: ['$ticketsSold', 0] },
              { $divide: ['$revenue', '$ticketsSold'] },
              0,
            ],
          },
        },
      },
    ]);

    const aggregatedMetrics = performanceData.reduce(
      (acc, event) => ({
        totalEvents: acc.totalEvents + 1,
        totalRevenue: acc.totalRevenue + event.revenue,
        totalTicketsSold: acc.totalTicketsSold + event.ticketsSold,
        totalCapacity: acc.totalCapacity + (event.capacity || 0),
        avgOccupancyRate: acc.avgOccupancyRate + event.occupancyRate,
        avgRevenuePerTicket: acc.avgRevenuePerTicket + event.revenuePerTicket,
      }),
      {
        totalEvents: 0,
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalCapacity: 0,
        avgOccupancyRate: 0,
        avgRevenuePerTicket: 0,
      },
    );

    if (performanceData.length > 0) {
      aggregatedMetrics.avgOccupancyRate =
        aggregatedMetrics.avgOccupancyRate / performanceData.length;
      aggregatedMetrics.avgRevenuePerTicket =
        aggregatedMetrics.avgRevenuePerTicket / performanceData.length;
    }

    return {
      summary: aggregatedMetrics,
      events: performanceData
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  }

  private getDateRange(query: AnalyticsQueryDto) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (query.timeRange) {
      case TimeRange.LAST_7_DAYS:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case TimeRange.LAST_30_DAYS:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case TimeRange.LAST_3_MONTHS:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case TimeRange.LAST_6_MONTHS:
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case TimeRange.LAST_YEAR:
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case TimeRange.CUSTOM:
        start = query.startDate
          ? new Date(query.startDate)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = query.endDate ? new Date(query.endDate) : now;
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private getPreviousPeriod(dateRange: any) {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime()),
    };
  }

  private getCompanyFilter(user: any, requestedCompanyId?: string) {
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return requestedCompanyId ? { companyId: requestedCompanyId } : {};
    }
    return { companyId: user.companyId };
  }

  private getPeriodLabel(timeRange?: TimeRange): string {
    switch (timeRange) {
      case TimeRange.LAST_7_DAYS:
        return 'Last 7 days';
      case TimeRange.LAST_30_DAYS:
        return 'Last 30 days';
      case TimeRange.LAST_3_MONTHS:
        return 'Last 3 months';
      case TimeRange.LAST_6_MONTHS:
        return 'Last 6 months';
      case TimeRange.LAST_YEAR:
        return 'Last year';
      case TimeRange.CUSTOM:
        return 'Custom range';
      default:
        return 'Last 30 days';
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
