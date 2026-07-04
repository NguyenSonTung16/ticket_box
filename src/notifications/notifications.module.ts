import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsCron } from './notifications.cron';
import { EmailService } from './email.service';
import { User } from '../auth/entities/user.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import { Invoice } from '../booking/entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ticket, Invoice])],
  providers: [NotificationsService, NotificationsCron, EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
