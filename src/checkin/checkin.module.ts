import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { GateDevice } from './entities/gate-device.entity';
import { Checkin } from './entities/checkin.entity';
import { OfflineSyncLog } from './entities/offline-sync-log.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import { User } from '../auth/entities/user.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GateDevice, Checkin, OfflineSyncLog, Ticket, User]),
    AuthModule,
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
