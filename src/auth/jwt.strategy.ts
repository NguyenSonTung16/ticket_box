import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
  }

  async validate(payload: any) {
    if (payload.jti) {
      const isBlacklisted = await this.redis.get(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // payload.sub chứa userId, payload.role chứa role
    return { 
      userId: payload.sub,
      id: payload.sub, // for compatibility with Repository 1 which expects req.user.id
      role: payload.role || 'USER',
      permissions: payload.permissions || []
    };
  }
}
