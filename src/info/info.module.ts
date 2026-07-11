import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { InfoController } from './info.controller';
import { InfoService } from './info.service';
import { Concert } from './entities/concert.entity';
import { EventTicketType } from './entities/event-ticket-type.entity';
import { SeatInventory } from '../booking/entities/seat-inventory.entity';
import { ShowInfo, ShowInfoSchema } from './schemas/show-info.schema';
import { ZoneInventory } from '../booking/entities/zone-inventory.entity';
import { ArtistBio } from '../ai/entities/artist-bio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, ZoneInventory, EventTicketType, SeatInventory, ArtistBio]),
    MongooseModule.forFeature([{ name: ShowInfo.name, schema: ShowInfoSchema }]),
  ],
  controllers: [InfoController],
  providers: [InfoService],
  exports: [InfoService],
})
export class InfoModule {}
