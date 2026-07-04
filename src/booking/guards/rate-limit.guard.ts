import { CanActivate, ExecutionContext, Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.config';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;

    if (!userId) {
      return true; // Nếu chưa có user (sẽ bị cản bởi JwtAuthGuard), cho qua bước rate limit này
    }

    const now = Date.now();
    const windowMs = 10000; // Cửa sổ trượt 10 giây
    const maxRequests = 2;  // Tối đa 2 thao tác trong 10 giây
    const key = `rate_limit:hold:${userId}`;

    // Bước 1: Xóa các timestamp cũ ngoài khung 10 giây trước
    await this.redis.zremrangebyscore(key, 0, now - windowMs);

    // Bước 2: Đếm số lượng thao tác đang có trong cửa sổ hiện tại
    const currentCount = await this.redis.zcard(key);

    if (currentCount >= maxRequests) {
      throw new HttpException(
        'Bạn thao tác bấm giữ ghế quá nhanh! Vui lòng đợi vài giây trước khi thử lại.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Bước 3: Ghi nhận thao tác mới vào Sorted Set
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    // Đặt hạn tự xóa sau 15 giây để giải phóng RAM Redis
    await this.redis.expire(key, 15);

    return true;
  }
}
