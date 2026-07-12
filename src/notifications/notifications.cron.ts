import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as amqp from 'amqplib';
import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { Invoice } from '../booking/entities/invoice.entity';
import { ImportJob, ImportJobStatus } from '../guest/entities/import-job.entity';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL) private readonly rabbitChannel: amqp.Channel,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(ImportJob) private readonly importJobRepo: Repository<ImportJob>,
  ) {}

  // Chạy mỗi ngày vào lúc 00:00 để gửi nhắc nhở 24h trước khi sự kiện diễn ra
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReminders() {
    this.logger.log('Bắt đầu chạy Cronjob gửi nhắc nhở sự kiện 24h tới...');
    
    // 1. Lấy danh sách users đã mua vé thành công từ Database (Thực tế)
    const paidInvoices = await this.invoiceRepo.find({
      where: { status: 'PAID' },
      relations: ['user'],
    });

    const usersMap = new Map();
    for (const inv of paidInvoices) {
      if (inv.user && inv.user.email) {
        usersMap.set(inv.user.id, { id: inv.user.id, email: inv.user.email });
      }
    }

    const realUsers = Array.from(usersMap.values());
    if (realUsers.length === 0) {
      this.logger.log('Không có người dùng nào đã thanh toán vé để gửi nhắc nhở.');
      return;
    }

    // 2. Chia batch gửi vào RabbitMQ
    const batchSize = 500;
    for (let i = 0; i < realUsers.length; i += batchSize) {
      const batch = realUsers.slice(i, i + batchSize);
      try {
        this.rabbitChannel.sendToQueue('notification_queue', Buffer.from(JSON.stringify({
          type: 'BULK_REMINDER', 
          concert_id: 1,
          showName: 'Sự kiện âm nhạc TicketBox',
          batchSize: batch.length,
          users: batch
        })), { persistent: true });
        this.logger.log(`Đã đẩy thành công batch ${batch.length} users thực tế vào hàng đợi notification_queue.`);
      } catch (error) {
        this.logger.error(`Lỗi khi đẩy batch ${batch.length} users vào queue: ${error.message}`);
      }
    }
  }
  private fetchUsersBatch(offset: number, limit: number) {
    const users = [];
    for (let i = 0; i < limit; i++) {
      users.push({ id: `user_${offset + i}` });
    }
    return users;
  }

  /**
   * Zombie Job Detector — runs every 5 minutes.
   * Finds import_jobs stuck in PROCESSING for >30 min (worker likely crashed)
   * and marks them FAILED so admins can re-trigger.
   */
  @Cron('*/5 * * * *')
  async detectZombieImportJobs() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const zombies = await this.importJobRepo.find({
      where: { status: ImportJobStatus.PROCESSING, startedAt: LessThan(cutoff) },
    });

    if (zombies.length === 0) return;

    for (const job of zombies) {
      this.logger.warn(
        `[ZOMBIE] Import job ${job.id} (sponsor=${job.sponsorId}) ` +
        `stuck in PROCESSING since ${job.startedAt?.toISOString()}. Marking FAILED.`,
      );
      await this.importJobRepo.update(job.id, {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
      });
      // Post-MVP: publish a Slack/email alert here via notification_queue
    }
    this.logger.warn(`[ZOMBIE] Resolved ${zombies.length} stuck import job(s).`);
  }
}
