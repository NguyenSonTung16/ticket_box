import { Controller, Post, Get, Body, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { VerifyTicketDto, SyncOfflineCheckinDto } from './dto/checkin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CHECKIN_SCAN')
  async verify(
    @Body() dto: VerifyTicketDto,
    @Req() req: any,
    @Headers('x-device-code') deviceCode?: string,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.checkinService.verifyOnline(dto, userId, deviceCode);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CHECKIN_SCAN')
  async sync(@Body() dto: SyncOfflineCheckinDto, @Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.checkinService.syncOffline(dto, userId);
  }

  @Get('mock-tickets')
  async getMockTickets(@Query('concertId') concertId?: string) {
    return this.checkinService.getMockTickets(concertId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CHECKIN_VIEW_HISTORY')
  async getHistory(
    @Query('concertId') concertId: string,
    @Query('deviceId') deviceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? parseInt(page as any, 10) : 1;
    const limitNum = limit ? parseInt(limit as any, 10) : 50;
    return this.checkinService.getHistory(concertId, deviceId, pageNum, limitNum);
  }
}
