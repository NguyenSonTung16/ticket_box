import { Controller, Post, Body, Ip, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password?: string }) {
    return this.authService.register(body.email, body.password || '123456');
  }

  @Post('login')
  async login(@Body() body: { email: string; password?: string }, @Ip() ip: string) {
    const clientIp = ip === '::1' ? '127.0.0.1' : ip;
    return this.authService.login(body.email, body.password || '123456', clientIp);
  }

  @Post('refresh')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshToken(body.userId, body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || '';
    return this.authService.logout(token);
  }
}
