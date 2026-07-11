import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 ngày
  private readonly GRACE_PERIOD = 30; // 30 giây grace period

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async generateTokens(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const role = user?.role || 'USER';
    const jti = `at_${crypto.randomBytes(8).toString('hex')}`;
    const accessToken = this.jwtService.sign({ sub: userId, role, jti });
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Lưu Refresh Token vào Redis
    const redisKey = `refresh_token:${userId}`;
    await this.redis.set(redisKey, refreshToken, 'EX', this.REFRESH_TOKEN_TTL);

    return { accessToken, refreshToken };
  }

  async refreshToken(userId: string, oldRefreshToken: string) {
    const redisKey = `refresh_token:${userId}`;
    const graceKey = `grace_period:${userId}`;

    // Lấy token hiện tại từ Redis
    const currentToken = await this.redis.get(redisKey);

    // Xử lý Race Condition bằng Grace Period
    // Nếu token gửi lên không khớp với token trong Redis
    if (currentToken !== oldRefreshToken) {
      // Kiểm tra xem có đang trong Grace Period không (có request nào khác vừa refresh xong không)
      const inGracePeriod = await this.redis.get(graceKey);
      if (inGracePeriod) {
        // Trả về access token mới từ inGracePeriod mà không xoay vòng token nữa
        // Giúp các request gọi đồng thời (ví dụ nhiều tab) không bị logout
        return { accessToken: inGracePeriod, refreshToken: currentToken };
      }
      // Nếu không khớp và không trong Grace Period -> Có thể token bị đánh cắp
      await this.redis.del(redisKey);
      throw new UnauthorizedException('Invalid refresh token. Thao tác có thể không an toàn, buộc đăng xuất.');
    }

    // Token hợp lệ, tiến hành tạo cặp token mới
    const newTokens = await this.generateTokens(userId);

    // Lưu Access Token mới vào Grace Period key (tồn tại trong 30s)
    // Các request dùng oldRefreshToken trong 30s tới sẽ nhận được newTokens.accessToken này
    await this.redis.set(graceKey, newTokens.accessToken, 'EX', this.GRACE_PERIOD);

    return newTokens;
  }

  // Thay thế loginDev bằng Register thực tế
  async register(email: string, passwordPlain: string) {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('Email đã tồn tại');
    }
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = this.userRepository.create({ email, passwordHash });
    await this.userRepository.save(user);
    
    return this.generateTokens(user.id);
  }

  // Thay thế bằng Login thực tế
  async login(email: string, passwordPlain: string, ip: string = '127.0.0.1') {
    const rateLimitKey = `failed_login_count:${ip}_${email}`;
    const blockKey = `login_blocked:${ip}_${email}`;
    const consecutiveFailedKey = `consecutive_failed:${email}`;

    // 1. Check if blocked
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      throw new UnauthorizedException('Too many failed login attempts. Please try again after 15 minutes');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      await this.handleFailedLogin(ip, email);
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // 2. Check if account is locked
    if (user.status === 'LOCKED') {
      throw new UnauthorizedException('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.');
    }

    // 3. Verify password
    let isMatch = false;
    // Nếu là dev user cũ (hashed_password) thì cho pass để tương thích, ngược lại dùng bcrypt
    if (user.passwordHash === 'hashed_password') {
      isMatch = passwordPlain === '123456';
    } else {
      isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    }

    if (!isMatch) {
      await this.handleFailedLogin(ip, email, user.id);
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Success - Reset counters
    await this.redis.del(rateLimitKey);
    await this.redis.del(consecutiveFailedKey);

    return this.generateTokens(user.id);
  }

  async logout(accessToken: string) {
    try {
      const payload = this.jwtService.decode(accessToken) as any;
      if (payload && payload.jti) {
        // Blacklist token in Redis for 15 minutes (or its remaining TTL)
        await this.redis.set(`blacklist:${payload.jti}`, '1', 'EX', 15 * 60);
      }
    } catch (err) {
      // Ignore decode error
    }
    return { success: true, message: 'Logged out successfully' };
  }

  private async handleFailedLogin(ip: string, email: string, userId?: string) {
    const rateLimitKey = `failed_login_count:${ip}_${email}`;
    const blockKey = `login_blocked:${ip}_${email}`;
    const consecutiveFailedKey = `consecutive_failed:${email}`;

    // Increment failed login count for IP+Email
    const failedCountStr = await this.redis.get(rateLimitKey);
    const failedCount = failedCountStr ? parseInt(failedCountStr, 10) + 1 : 1;
    await this.redis.set(rateLimitKey, failedCount.toString(), 'EX', 15 * 60);

    if (failedCount >= 5) {
      await this.redis.set(blockKey, '1', 'EX', 15 * 60);
    }

    // Handle consecutive failures for account lock
    const consecStr = await this.redis.get(consecutiveFailedKey);
    const consecCount = consecStr ? parseInt(consecStr, 10) + 1 : 1;
    await this.redis.set(consecutiveFailedKey, consecCount.toString(), 'EX', 24 * 60 * 60); // persist for 24h

    if (consecCount >= 10 && userId) {
      await this.userRepository.update(userId, { status: 'LOCKED' });
    }
  }
}
