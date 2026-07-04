import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './worker.service';
import { Invoice } from '../booking/entities/invoice.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import { SeatInventory } from '../booking/entities/seat-inventory.entity';
import { ZoneInventory } from '../booking/entities/zone-inventory.entity';
import { IdempotencyKey } from '../payment/entities/idempotency-key.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { WorkerController } from './worker.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Ticket,
      SeatInventory,
      ZoneInventory,
      IdempotencyKey,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
