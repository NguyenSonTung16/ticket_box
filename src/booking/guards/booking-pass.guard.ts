import { CanActivate, ExecutionContext, Inject, Injectable, ForbiddenException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.config';

@Injectable()
export class BookingPassGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    
    // Kiểm tra user từ JwtAuthGuard
    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Bạn cần đăng nhập để tham gia chọn ghế.');
    }

    // Lấy concertId từ params (vd: /show/:id/seats) hoặc body (vd: { concert_id: 1 })
    const concertId = req.params?.id || req.body?.concert_id;
    if (!concertId) {
      throw new ForbiddenException('Không xác định được ID sự kiện (concert_id).');
    }

    // Kiểm tra Booking Pass trong Redis: booking_pass:{concertId}:{userId}
    const passKey = `booking_pass:${concertId}:${userId}`;
    const hasPass = await this.redis.get(passKey);

    if (!hasPass) {
      throw new ForbiddenException('Bạn chưa có Giấy thông hành (Booking Pass) hoặc thời gian chọn ghế (5 phút) đã kết thúc! Vui lòng quay lại Phòng chờ.');
    }

    return true;
  }
}
