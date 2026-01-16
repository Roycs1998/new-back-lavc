import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SponsorStandsService } from './sponsor-stands.service';
import { ScanSponsorQRDto } from './dto/scan-sponsor-qr.dto';
import { ScanAttendeeQRDto } from './dto/scan-attendee-qr.dto';
import { SponsorStandVisitDto } from './dto/sponsor-stand-visit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import type { SponsorStandQrLinkResponse } from './sponsor-stands.service';

@ApiTags('Sponsor Stands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sponsor-stands')
export class SponsorStandsController {
  constructor(private readonly standsService: SponsorStandsService) {}

  @Post(':sponsorId/qr/generate')
  @ApiOperation({ summary: 'Generar QR para el stand del sponsor' })
  async generateStandQR(
    @Param('sponsorId') sponsorId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SponsorStandQrLinkResponse> {
    return this.standsService.generateStandQR(sponsorId, user.id);
  }

  @Post(':sponsorId/scan-sponsor')
  @ApiOperation({ summary: 'Usuario escanea el QR del stand del sponsor' })
  @ApiResponse({ type: SponsorStandVisitDto })
  async scanSponsorQR(
    @Param('sponsorId') sponsorId: string,
    @Body() dto: ScanSponsorQRDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SponsorStandVisitDto> {
    // Ensure dto.sponsorId matches param if needed, or just use param
    dto.sponsorId = sponsorId;
    return this.standsService.recordVisitByUser(user.id, dto);
  }

  @Post(':sponsorId/scan-attendee')
  @ApiOperation({ summary: 'Staff del sponsor escanea QR de un asistente' })
  @ApiResponse({ type: SponsorStandVisitDto })
  async scanAttendeeQR(
    @Param('sponsorId') sponsorId: string,
    @Body() dto: ScanAttendeeQRDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SponsorStandVisitDto> {
    return this.standsService.recordVisitByStaff(user.id, sponsorId, dto);
  }

  @Get(':sponsorId/visits')
  @ApiOperation({ summary: 'Obtener historial de visitas de un sponsor' })
  @ApiResponse({ type: [SponsorStandVisitDto] })
  async getSponsorVisits(@Param('sponsorId') sponsorId: string) {
    return this.standsService.getSponsorVisits(sponsorId);
  }

  @Get('my-visits')
  @ApiOperation({ summary: 'Obtener historial de visitas del usuario actual' })
  @ApiResponse({ type: [SponsorStandVisitDto] })
  async getMyVisits(@CurrentUser() user: CurrentUserData) {
    return this.standsService.getUserVisits(user.id);
  }
}
