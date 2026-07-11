import { Controller, Post, Get, Put, Body, Param, UseInterceptors, UploadedFile, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('artist')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('AI_BIO_UPLOAD')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('concertId') concertId: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.aiService.uploadArtistDocument(file, Number(concertId), userId);
  }

  @Post('generate-bio')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('AI_BIO_UPLOAD')
  @HttpCode(HttpStatus.OK)
  async generateBio(
    @Body('documentId') documentId: string,
    @Body('promptTemplateId') promptTemplateId?: string,
  ) {
    return this.aiService.generateBio(documentId, promptTemplateId);
  }

  @Get('bio/:id')
  @UseGuards(JwtAuthGuard)
  async getBio(@Param('id') id: string) {
    return this.aiService.getBio(id);
  }

  @Put('bio/:id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('AI_BIO_UPLOAD')
  @HttpCode(HttpStatus.OK)
  async approveBio(
    @Param('id') id: string,
    @Body() body: { shortBio?: string; mediumBio?: string; seoBio?: string },
    @Req() req: any,
  ) {
    const userId = req.user.userId || req.user.id;
    const { shortBio, mediumBio, seoBio } = body;
    return this.aiService.approveBio(id, shortBio || '', mediumBio || '', seoBio || '', userId);
  }
}
