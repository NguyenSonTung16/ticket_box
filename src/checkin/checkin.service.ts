import { Injectable, BadRequestException, ConflictException, HttpException, HttpStatus, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import * as amqp from 'amqplib';
import * as crypto from 'crypto';

import { REDIS_CLIENT } from '../config/redis.config';
import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { GateDevice } from './entities/gate-device.entity';
import { Checkin } from './entities/checkin.entity';
import { OfflineSyncLog } from './entities/offline-sync-log.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import { VerifyTicketDto, SyncOfflineCheckinDto } from './dto/checkin.dto';

export const DEV_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIHpRqvVxUtGOGALiJ4iwUBD4mrvVd57F2sKLRKynbPjG\n-----END PRIVATE KEY-----`;
export const DEV_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAtpQjNk5cS5jF9MmvAG21SE8QhHzjxkKLUTzPEYRAUwY=\n-----END PUBLIC KEY-----`;

@Injectable()
export class CheckinService implements OnModuleInit {
  private readonly logger = new Logger(CheckinService.name);
  private readonly CHECKIN_EXCHANGE = 'checkin.exchange';

  constructor(
    @InjectRepository(GateDevice)
    private readonly gateDeviceRepo: Repository<GateDevice>,
    @InjectRepository(Checkin)
    private readonly checkinRepo: Repository<Checkin>,
    @InjectRepository(OfflineSyncLog)
    private readonly syncLogRepo: Repository<OfflineSyncLog>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @Inject(RABBITMQ_CHANNEL)
    private readonly rabbitChannel: amqp.Channel,
  ) {}

  async onModuleInit() {
    try {
      await this.rabbitChannel.assertExchange(this.CHECKIN_EXCHANGE, 'direct', { durable: true });
      this.logger.log(`Asserted RabbitMQ exchange: ${this.CHECKIN_EXCHANGE}`);
    } catch (err) {
      this.logger.error(`Failed to assert exchange: ${err.message}`);
    }
  }

  verifySignature(
    ticketId: string,
    concertId: string,
    seatInfo: string,
    issuedAt: number,
    signature: string,
  ): boolean {
    const message = `${ticketId}.${concertId}.${seatInfo}.${issuedAt}`;
    const publicKeyPem = process.env.ED25519_PUBLIC_KEY || DEV_PUBLIC_KEY;
    try {
      const data = Buffer.from(message, 'utf8');
      
      const encodings = ['base64url', 'base64', 'hex'] as const;
      for (const encoding of encodings) {
        try {
          const sigBuffer = Buffer.from(signature, encoding);
          if (sigBuffer.length === 64) {
            const verified = crypto.verify(null, data, publicKeyPem, sigBuffer);
            if (verified) return true;
          }
        } catch {}
      }
      return false;
    } catch (err) {
      this.logger.error(`Signature verification failed: ${err.message}`);
      return false;
    }
  }

  async getOrCreateDevice(deviceCode: string): Promise<GateDevice> {
    let device = await this.gateDeviceRepo.findOne({ where: { deviceCode } });
    if (!device) {
      device = this.gateDeviceRepo.create({
        deviceCode,
        gateName: 'Default Gate',
        location: 'Main Gate',
        status: 'ACTIVE',
      });
      device = await this.gateDeviceRepo.save(device);
    }
    return device;
  }

  async verifyOnline(dto: VerifyTicketDto, checkerId: string, deviceCodeHeader?: string) {
    const { ticketId, concertId, seatInfo, issuedAt, signature } = dto;

    // 1. Verify digital signature
    const isValidSignature = this.verifySignature(ticketId, concertId, seatInfo, issuedAt, signature);
    if (!isValidSignature) {
      throw new BadRequestException('Digital signature verification failed. Possible fraud.');
    }

    // 2. Acquire Redis Distributed Lock
    const lockKey = `lock:checkin:${ticketId}`;
    const lockResult = await this.redis.set(lockKey, '1', 'PX', 5000, 'NX');
    const locked = lockResult === 'OK';
    if (!locked) {
      throw new HttpException('Transaction in progress. Please try again.', HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      // 3. Query Ticket
      const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
      if (!ticket) {
        throw new BadRequestException('Ticket not found');
      }
      // Note: Repository 2 uses number for concert_id, convert concertId to number
      if (ticket.concert_id !== Number(concertId)) {
        throw new BadRequestException('Ticket does not belong to this concert');
      }
      if (ticket.status === 'refunded') {
        throw new BadRequestException('Ticket has been refunded');
      }
      if (ticket.status === 'invalid') {
        throw new BadRequestException('Ticket has been invalidated');
      }

      // 4. Check if checked in
      if (ticket.status === 'checked_in') {
        const checkin = await this.checkinRepo.findOne({
          where: { ticketId, syncStatus: 'SUCCESS' },
          relations: ['device'],
        });
        const details = checkin
          ? ` at ${checkin.device.gateName} at ${checkin.scannedAt.toISOString()}`
          : '';
        throw new ConflictException(`Ticket already scanned${details}`);
      }

      const deviceCode = deviceCodeHeader || 'dev-macbook-gate-1';
      const device = await this.getOrCreateDevice(deviceCode);

      // 5. Perform Check-in
      const checkinRecord = this.checkinRepo.create({
        ticketId,
        checkerId,
        deviceId: device.id,
        scannedAt: new Date(),
        isOffline: false,
        syncStatus: 'SUCCESS',
        rawPayload: JSON.stringify(dto),
      });
      await this.checkinRepo.save(checkinRecord);

      await this.ticketRepo.update(ticketId, { status: 'checked_in' });

      // 6. Publish Event
      this.rabbitChannel.publish(
        this.CHECKIN_EXCHANGE,
        'checkin.event.verified',
        Buffer.from(JSON.stringify({
          ticketId,
          scannedAt: checkinRecord.scannedAt,
          deviceId: device.id,
          isOffline: false,
        })),
        { persistent: true }
      );

      this.logger.log(`Ticket ${ticketId} successfully checked in online.`);

      return {
        status: 'SUCCESS',
        message: 'Check-in successful',
        ticketId,
        scannedAt: checkinRecord.scannedAt,
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async syncOffline(dto: SyncOfflineCheckinDto, checkerId: string) {
    const { deviceId, batchId, checkins } = dto;
    const device = await this.getOrCreateDevice(deviceId);

    // Create sync log
    let syncLog = this.syncLogRepo.create({
      deviceId: device.id,
      batchId,
      totalRecords: checkins.length,
      successRecords: 0,
      failedRecords: 0,
    });
    syncLog = await this.syncLogRepo.save(syncLog);

    let successCount = 0;
    let failedCount = 0;
    const conflicts: any[] = [];

    for (const item of checkins) {
      try {
        const { ticketId, concertId, seatInfo, issuedAt, scannedAt, signature } = item;
        const scannedDate = new Date(scannedAt);

        // 1. Verify signature
        const isValidSignature = this.verifySignature(ticketId, concertId, seatInfo, issuedAt, signature);
        if (!isValidSignature) {
          failedCount++;
          conflicts.push({
            ticketId,
            reason: 'Signature verification failed',
            resolution: 'REJECTED',
          });
          continue;
        }

        // 2. Fetch Ticket
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket || ticket.concert_id !== Number(concertId)) {
          failedCount++;
          conflicts.push({
            ticketId,
            reason: 'Ticket not found or wrong concert',
            resolution: 'REJECTED',
          });
          continue;
        }

        if (ticket.status === 'refunded' || ticket.status === 'invalid') {
          failedCount++;
          conflicts.push({
            ticketId,
            reason: `Ticket is ${ticket.status}`,
            resolution: 'REJECTED',
          });
          continue;
        }

        // 3. Find if already check-in in Postgres
        const existingSuccessCheckin = await this.checkinRepo.findOne({
          where: { ticketId, syncStatus: 'SUCCESS' },
        });

        if (existingSuccessCheckin) {
          // Conflict detected! Apply First Write Wins based on scannedAt
          const existingTime = existingSuccessCheckin.scannedAt.getTime();
          const syncTime = scannedDate.getTime();

          if (syncTime < existingTime) {
            // Synced check-in was actually earlier! Update existing checkin to DUPLICATE
            await this.checkinRepo.update(existingSuccessCheckin.id, { syncStatus: 'DUPLICATE' });

            // Insert new checkin as SUCCESS
            await this.checkinRepo.save(
              this.checkinRepo.create({
                ticketId,
                checkerId,
                deviceId: device.id,
                scannedAt: scannedDate,
                syncedAt: new Date(),
                isOffline: true,
                syncStatus: 'SUCCESS',
                rawPayload: JSON.stringify(item),
              })
            );

            // Trigger conflict alerts
            this.rabbitChannel.publish(
              this.CHECKIN_EXCHANGE,
              'checkin.event.conflict',
              Buffer.from(JSON.stringify({
                ticketId,
                reason: `Conflict resolved: Synced checkin (${scannedDate.toISOString()}) scanned earlier than existing (${existingSuccessCheckin.scannedAt.toISOString()}).`,
                resolution: 'RESOLVED_REPLACED',
                deviceId: device.id,
              })),
              { persistent: true }
            );

            this.rabbitChannel.publish(
              this.CHECKIN_EXCHANGE,
              'checkin.event.verified',
              Buffer.from(JSON.stringify({
                ticketId,
                scannedAt: scannedDate,
                deviceId: device.id,
                isOffline: true,
              })),
              { persistent: true }
            );

            successCount++;
            conflicts.push({
              ticketId,
              reason: `Ticket already scanned at ${existingSuccessCheckin.scannedAt.toISOString()}. Synced scan is earlier (${scannedDate.toISOString()}). First Write Wins applied.`,
              resolution: 'CONFLICT_LOGGED',
            });
          } else {
            // Synced check-in is later! Insert as CONFLICT
            await this.checkinRepo.save(
              this.checkinRepo.create({
                ticketId,
                checkerId,
                deviceId: device.id,
                scannedAt: scannedDate,
                syncedAt: new Date(),
                isOffline: true,
                syncStatus: 'CONFLICT',
                rawPayload: JSON.stringify(item),
              })
            );

            this.rabbitChannel.publish(
              this.CHECKIN_EXCHANGE,
              'checkin.event.conflict',
              Buffer.from(JSON.stringify({
                ticketId,
                reason: `Conflict: Synced checkin (${scannedDate.toISOString()}) scanned later than existing (${existingSuccessCheckin.scannedAt.toISOString()}).`,
                resolution: 'CONFLICT_LOGGED',
                deviceId: device.id,
              })),
              { persistent: true }
            );

            failedCount++;
            conflicts.push({
              ticketId,
              reason: `Ticket already scanned at ${existingSuccessCheckin.scannedAt.toISOString()}. Synced scan is later (${scannedDate.toISOString()}). First Write Wins applied.`,
              resolution: 'CONFLICT_LOGGED',
            });
          }
        } else {
          // No prior check-in. Process normally
          await this.checkinRepo.save(
            this.checkinRepo.create({
              ticketId,
              checkerId,
              deviceId: device.id,
              scannedAt: scannedDate,
              syncedAt: new Date(),
              isOffline: true,
              syncStatus: 'SUCCESS',
              rawPayload: JSON.stringify(item),
            })
          );

          await this.ticketRepo.update(ticketId, { status: 'checked_in' });

          this.rabbitChannel.publish(
            this.CHECKIN_EXCHANGE,
            'checkin.event.verified',
            Buffer.from(JSON.stringify({
              ticketId,
              scannedAt: scannedDate,
              deviceId: device.id,
              isOffline: true,
            })),
            { persistent: true }
          );

          successCount++;
        }
      } catch (err) {
        failedCount++;
        this.logger.error(`Error processing sync item: ${err.message}`);
        conflicts.push({
          ticketId: item.ticketId,
          reason: `Internal error: ${err.message}`,
          resolution: 'REJECTED',
        });
      }
    }

    // Update sync log
    await this.syncLogRepo.update(syncLog.id, {
      successRecords: successCount,
      failedRecords: failedCount,
    });

    await this.gateDeviceRepo.update(device.id, { lastSyncAt: new Date() });

    return {
      batchId,
      processedCount: checkins.length,
      successCount,
      conflicts,
    };
  }

  async getHistory(concertId: string, deviceId?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.checkinRepo.createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.ticket', 'ticket')
      .innerJoinAndSelect('checkin.device', 'device')
      .where('ticket.concert_id = :concertId', { concertId: Number(concertId) });

    if (deviceId) {
      queryBuilder.andWhere('device.deviceCode = :deviceId', { deviceId });
    }

    const [data, total] = await queryBuilder
      .orderBy('checkin.scannedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((c) => ({
        id: c.id,
        ticketId: c.ticketId,
        seatInfo: JSON.parse(c.rawPayload || '{}').seatInfo || 'N/A',
        scannedAt: c.scannedAt,
        deviceId: c.device.deviceCode,
        syncStatus: c.syncStatus,
        isOffline: c.isOffline,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMockTickets() {
    const tickets = await this.ticketRepo.find({
      take: 30,
    });

    const privateKeyPem = process.env.ED25519_PRIVATE_KEY || DEV_PRIVATE_KEY;
    const issuedAt = 1717848000;

    return tickets.map(ticket => {
      const message = `${ticket.id}.${ticket.concert_id}.${ticket.seatNo}.${issuedAt}`;
      let signature = '';
      try {
        signature = crypto.sign(null, Buffer.from(message, 'utf8'), privateKeyPem).toString('base64url');
      } catch (err) {
        this.logger.error(`Failed to sign mock ticket: ${err.message}`);
      }

      return {
        ticketId: ticket.id,
        concertId: String(ticket.concert_id),
        seatInfo: ticket.seatNo,
        issuedAt,
        signature,
        status: ticket.status,
      };
    });
  }
}
