import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { EventController } from './event.controller';
import { EventService } from './event.service';

import { Concert } from '../info/entities/concert.entity';
import { EventTicketType } from '../info/entities/event-ticket-type.entity';
import { SeatInventory } from '../booking/entities/seat-inventory.entity';
import { Invoice } from '../booking/entities/invoice.entity';
import { ShowInfo, ShowInfoSchema } from '../info/schemas/show-info.schema';

import { EVENT_PUBLISHER } from './interfaces/event-publisher.interface';
import { RabbitMQEventPublisher } from './publishers/rabbitmq-event.publisher';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, EventTicketType, SeatInventory, Invoice]),
    MongooseModule.forFeature([{ name: ShowInfo.name, schema: ShowInfoSchema }]),
    AuthModule,
  ],
  controllers: [EventController],
  providers: [
    EventService,
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
  exports: [EventService],
})
export class EventModule {}
