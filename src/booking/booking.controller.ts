import { Controller, Get, Post, Param, Body, Sse, MessageEvent, UseGuards, Req } from '@nestjs/common';
import { BookingService } from './booking.service';
import { SseService } from './sse.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingPassGuard } from './guards/booking-pass.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly sseService: SseService,
  ) {}

  @Get('show/:id/seats')
  async getSeatStatus(@Param('id') concert_id: string) {
    return this.bookingService.getSeatStatus(Number(concert_id));
  }

  @Get('show/:id/inventory')
  async getInventory(@Param('id') concert_id: string) {
    return this.bookingService.getInventory(Number(concert_id));
  }

  @UseGuards(JwtAuthGuard)
  @Get('show/:id/quota')
  async getQuota(@Param('id') concert_id: string, @Req() req) {
    const limits = {
      SVIP: await this.bookingService.getTicketLimit(Number(concert_id), 'SVIP'),
      VIP: await this.bookingService.getTicketLimit(Number(concert_id), 'VIP'),
      Normal: await this.bookingService.getTicketLimit(Number(concert_id), 'Normal'),
    };
    const userQuota = await this.bookingService.getUserQuota(Number(concert_id), req.user.userId);
    return { limits, userQuota };
  }


  @UseGuards(JwtAuthGuard)
  @Post('enter-queue')
  async enterQueue(@Req() req, @Body() body: { concert_id: number }) {
    return this.bookingService.enterQueue(req.user.userId, Number(body.concert_id));
  }

  @UseGuards(JwtAuthGuard, BookingPassGuard)
  @Post('ga')
  async bookGA(@Req() req, @Body() body: { concert_id: number; quantity: number; zoneType?: string }) {
    const zoneType = body.zoneType || 'Normal';
    const userId = req.user.userId;
    return this.bookingService.bookGATicket(body.concert_id, userId, body.quantity, zoneType);
  }

  @UseGuards(JwtAuthGuard, BookingPassGuard)
  @Post('svip')
  async bookSVIP(@Req() req, @Body() body: { concert_id: number; seatNo: string }) {
    const userId = req.user.userId;
    return this.bookingService.bookSVIPTicket(body.concert_id, userId, body.seatNo);
  }

  @UseGuards(JwtAuthGuard, BookingPassGuard, RateLimitGuard)
  @Post('hold')
  async bookHold(@Req() req, @Body() body: { concert_id: number; seats: string[]; ticketCounts: Record<string, number> }) {
    const userId = req.user.userId;
    
    // Đặt toàn bộ ghế SVIP bằng 1 giao dịch nguyên tử (Lua Script & Bulk Update)
    if (body.seats && body.seats.length > 0) {
      await this.bookingService.bookMultipleSVIPTickets(body.concert_id, userId, body.seats);
    }
    const counts = body.ticketCounts || {};
    for (const [zone, count] of Object.entries(counts)) {
      if (count > 0) {
        await this.bookingService.bookGATicket(body.concert_id, userId, count, zone);
      }
    }
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, BookingPassGuard)
  @Post('pay')
  async payTickets(@Body() body: any, @Req() req) {
    return this.bookingService.payTickets(body.concert_id, req.user.userId, body);
  }

  @Sse('sse/:userId')
  sse(@Param('userId') userId: string, @Req() req: any): Observable<MessageEvent> {
    const subject = this.sseService.addClient(userId);
    
    // Sửa lỗi Rò rỉ bộ nhớ: Xóa client khỏi RAM khi họ đóng tab trình duyệt
    req.on('close', () => {
      this.sseService.removeClient(userId);
    });

    return subject.asObservable().pipe(
      map((payload) => ({ data: payload }))
    );
  }
}
