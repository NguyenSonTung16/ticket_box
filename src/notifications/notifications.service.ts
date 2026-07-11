import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { User } from '../auth/entities/user.entity';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL) private readonly rabbitChannel: amqp.Channel,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.startWorkerPool();
  }

  // Worker Pooling: Khởi tạo 10 Consumer chạy song song cho hàng đợi notification
  private startWorkerPool() {
    const numWorkers = 10;
    this.rabbitChannel.prefetch(5); 

    for (let i = 0; i < numWorkers; i++) {
      this.rabbitChannel.consume('notification_queue', async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            await this.processNotification(data, i);
            this.rabbitChannel.ack(msg);
          } catch (err) {
            this.logger.error(`Worker ${i} lỗi xử lý: ${err.message}`);
            this.rabbitChannel.nack(msg, false, false);
          }
        }
      });
    }
    this.logger.log(`Đã khởi động Worker Pool với ${numWorkers} consumer cho notification_queue.`);
  }

  private async processNotification(data: any, workerId: number) {
    if (data.type === 'BULK_REMINDER') {
      this.logger.log(`[Worker ${workerId}] Đang xử lý Bulk Message gồm ${data.batchSize || data.users?.length || 0} users...`);
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          if (u.email) {
            await this.emailService.sendReminderEmail(u.email, data.showName || `Show #${data.concert_id || 1}`);
          }
        }
      }
      this.logger.log(`[Worker ${workerId}] Đã xử lý xong batch email nhắc nhở.`);
      return;
    }

    // Luồng thông báo khi người dùng vừa giữ vé thành công
    if (data.userId) {
      const user = await this.userRepo.findOne({ where: { id: data.userId } });
      if (user && user.email) {
        await this.emailService.sendHoldNotificationEmail(
          user.email,
          data.concert_id || 1,
          data.type || 'Vé',
          data.quantity || 1,
        );
        this.logger.log(`[Worker ${workerId}] Đã gửi email thông báo giữ vé cho User: ${data.userId} (${user.email})`);
      } else {
        this.logger.warn(`[Worker ${workerId}] Không tìm thấy user hoặc email cho User ID: ${data.userId}`);
      }
    }
  }
}
