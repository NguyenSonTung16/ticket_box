import { Controller, Get, Param, Header } from '@nestjs/common';
import { InfoService } from './info.service';

@Controller('info')
export class InfoController {
  constructor(private readonly infoService: InfoService) {}

  @Get('shows')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getAllShows() {
    return await this.infoService.getAllShows();
  }

  @Get('show/:id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getShowInfo(@Param('id') concert_id: string) {
    return await this.infoService.getShowInfo(Number(concert_id));
  }
}
