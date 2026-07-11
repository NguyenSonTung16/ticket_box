import { Injectable, Inject, BadRequestException, Logger, forwardRef, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import NodeCache from 'node-cache';
import * as amqp from 'amqplib';
import { REDIS_CLIENT } from '../config/redis.config';
import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { SseService } from './sse.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatInventory } from './entities/seat-inventory.entity';
import { ZoneInventory } from './entities/zone-inventory.entity';

@Injectable()
export class BookingService implements OnModuleInit {
  private readonly logger = new Logger(BookingService.name);
  private seatCache = new NodeCache({ stdTTL: 1 }); // 1 second TTL
  private inventoryCache = new NodeCache({ stdTTL: 1 }); // 1 second TTL
  private activePromises = new Map<string, Promise<any>>(); // SingleFlight pattern

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(RABBITMQ_CHANNEL) private readonly rabbitChannel: amqp.Channel,
    @Inject(forwardRef(() => SseService)) private readonly sseService: SseService,
    @InjectRepository(SeatInventory) private readonly seatInventoryRepo: Repository<SeatInventory>,
    @InjectRepository(ZoneInventory) private readonly zoneInventoryRepo: Repository<ZoneInventory>,
  ) {}

  async onModuleInit() {
    this.logger.log('BookingService initialized.');
    // Note: Database seeding has been moved to src/scripts/seed.ts
    // to prevent Race Conditions in the Load Balancing cluster.
  }

  // Lấy trạng thái tất cả ghế SVIP
  async getSeatStatus(concert_id: number) {
    const seatHashKey = `concert:${concert_id}:svip_seats`;
    let seats = this.seatCache.get(seatHashKey);
    if (!seats) {
      if (this.activePromises.has(seatHashKey)) {
        seats = await this.activePromises.get(seatHashKey);
      } else {
        const promise = (async () => {
          try {
            const exists = await this.redis.exists(seatHashKey);
            if (!exists) {
              // LỖI REDIS TRỐNG: Chạy hàm đồng bộ từ DB lên Redis để phục hồi dữ liệu
              await this.repairSeatSync(concert_id);
            }
            const data = await this.redis.hgetall(seatHashKey);
            if (data) this.seatCache.set(seatHashKey, data);
            return data || {};
          } catch (error) {
            this.logger.error(`[Redis Error] getSeatStatus fallback: ${error.message}`);
            return {}; // Tránh văng lỗi 500
          } finally {
            this.activePromises.delete(seatHashKey);
          }
        })();
        this.activePromises.set(seatHashKey, promise);
        seats = await promise;
      }
    }
    return seats;
  }

  // Lấy lượng vé còn lại của tất cả các zone
  async getInventory(concert_id: number) {
    const inventoryKey = `concert:${concert_id}:inventory`;
    let inventory: any = this.inventoryCache.get(inventoryKey);
    
    if (!inventory) {
      if (this.activePromises.has(inventoryKey)) {
        inventory = await this.activePromises.get(inventoryKey);
      } else {
        const promise = (async () => {
          try {
            const exists = await this.redis.exists(inventoryKey);
            if (!exists) {
              // LỖI REDIS TRỐNG: Lấy từ DB lên để hiển thị đúng lượng vé còn lại
              const zones = await this.zoneInventoryRepo.find({ where: { concert_id } });
              for (const z of zones) {
                await this.redis.hsetnx(inventoryKey, z.zone, z.availableSlots);
              }
            }
            const data = await this.redis.hgetall(inventoryKey);
            if (data) this.inventoryCache.set(inventoryKey, data);
            return data || {};
          } catch (error) {
            this.logger.error(`[Redis Error] getInventory fallback: ${error.message}`);
            return {}; // Tránh văng lỗi 500
          } finally {
            this.activePromises.delete(inventoryKey);
          }
        })();
        this.activePromises.set(inventoryKey, promise);
        inventory = await promise;
      }
    }

    const parsed: Record<string, number> = {};
    for (const [key, val] of Object.entries(inventory || {})) {
      parsed[key] = parseInt(val as string, 10);
    }
    return parsed;
  }

  updateLocalSeatCache(payload: any) {
    if (payload.concert_id && payload.seatNo && payload.status) {
      const seatHashKey = `concert:${payload.concert_id}:svip_seats`;
      let seats: any = this.seatCache.get(seatHashKey);
      if (seats) {
        if (payload.status === 'held' || payload.status === 'booked') {
          seats[payload.seatNo] = payload.userId || 'held';
        } else if (payload.status === 'available') {
          delete seats[payload.seatNo];
        }
        this.seatCache.set(seatHashKey, seats);
      }
    }
  }

  // Lấy giới hạn vé của một Zone từ Redis (hoặc DB)
  async getTicketLimit(concert_id: number, zoneType: string): Promise<number> {
    const limitsKey = `concert:${concert_id}:zone_limits`;
    let limit = await this.redis.hget(limitsKey, zoneType);
    if (!limit) {
      const zoneInfo = await this.zoneInventoryRepo.findOne({ where: { zone: zoneType, concert_id } });
      if (!zoneInfo) return 4; // Mặc định nếu không tìm thấy
      await this.redis.hset(limitsKey, zoneType, zoneInfo.ticketLimit);
      limit = zoneInfo.ticketLimit.toString();
    }
    return parseInt(limit, 10);
  }

  // Lấy tổng hợp Quota hiện tại của User
  async getUserQuota(concert_id: number, userId: string) {
    const zones = ['svip', 'VIP', 'Normal'];
    const userQuota: Record<string, number> = {};
    for (const zone of zones) {
      const quotaStr = await this.redis.get(`user:${userId}:concert:${concert_id}:zone:${zone}`);
      // Trả về uppercase cho frontend dễ map (SVIP thay vì svip)
      const mappedZone = zone === 'svip' ? 'SVIP' : zone;
      userQuota[mappedZone] = quotaStr ? parseInt(quotaStr, 10) : 0;
    }
    return userQuota;
  }

  // Đặt vé General Admission (GA) sử dụng HINCRBY
  async bookGATicket(concert_id: number, userId: string, quantity: number, zoneType: string = 'Normal') {
    const inventoryKey = `concert:${concert_id}:inventory`;
    
    // Khởi tạo quota ban đầu nếu chưa tồn tại trong Redis
    const exists = await this.redis.hexists(inventoryKey, zoneType);
    if (!exists) {
      const zoneInfo = await this.zoneInventoryRepo.findOne({ where: { zone: zoneType, concert_id } });
      if (!zoneInfo) throw new BadRequestException(`Zone ${zoneType} không tồn tại.`);
      await this.redis.hsetnx(inventoryKey, zoneType, zoneInfo.availableSlots);
    }

    // Kiểm tra giới hạn số lượng vé mỗi tài khoản (Per-User Quota)
    const userQuotaKey = `user:${userId}:concert:${concert_id}:zone:${zoneType}`;
    const maxQuota = await this.getTicketLimit(concert_id, zoneType);
    
    const currentUserQuota = await this.redis.incrby(userQuotaKey, quantity);
    if (currentUserQuota > maxQuota) {
      await this.redis.incrby(userQuotaKey, -quantity);
      throw new BadRequestException(`Tài khoản chỉ được mua tối đa ${maxQuota} vé ${zoneType}.`);
    }

    // Sử dụng HINCRBY số âm để trừ số lượng vé một cách atomic
    const remaining = await this.redis.hincrby(inventoryKey, zoneType, -quantity);
    
    if (remaining < 0) {
      // Nếu số lượng âm tức là hết vé, cần rollback lại số vé và rollback lại Quota của user
      await this.redis.hincrby(inventoryKey, zoneType, quantity);
      await this.redis.incrby(userQuotaKey, -quantity);
      throw new BadRequestException(`Vé ${zoneType} đã bán hết.`);
    }

    // Gửi thông báo đến toàn bộ người dùng qua SSE sau khi giữ vé thành công
    this.sseService.broadcast({ message: `Vé ${zoneType} vừa được giữ`, quantity, type: zoneType });

    // Đẩy message vào RabbitMQ để gửi notification bất đồng bộ
    this.rabbitChannel.sendToQueue('notification_queue', Buffer.from(JSON.stringify({
      userId, concert_id, type: zoneType, quantity
    })));

    // Đẩy vào RabbitMQ Wait Queue để tự động hoàn trả số lượng (Rollback) nếu không thanh toán sau 20 giây
    const rollbackPayload = JSON.stringify({ concert_id, userId, type: zoneType, quantity, action: 'rollback_quantity' });
    this.rabbitChannel.sendToQueue('hold_timeout_wait_5m_queue', Buffer.from(rollbackPayload));

    return { success: true, remaining };
  }

  // Đặt ghế SVIP cụ thể sử dụng HSETNX để tránh trùng ghế
  async bookSVIPTicket(concert_id: number, userId: string, seatNo: string) {
    const seatHashKey = `concert:${concert_id}:svip_seats`;
    const maxSvipSeats = 40;

    // 1. Kiểm tra số lượng ghế đã bán (HLEN)
    const soldSeatsCount = await this.redis.hlen(seatHashKey);
    if (soldSeatsCount >= maxSvipSeats) {
      throw new BadRequestException('Đã hết ghế SVIP.');
    }

    // Kiểm tra giới hạn số lượng vé SVIP mỗi tài khoản (Per-User Quota)
    const userQuotaKey = `user:${userId}:concert:${concert_id}:zone:svip`; // 'svip' key
    const maxSvipPerUser = await this.getTicketLimit(concert_id, 'SVIP');

    const currentUserQuota = await this.redis.incr(userQuotaKey);
    if (currentUserQuota > maxSvipPerUser) {
      await this.redis.decr(userQuotaKey);
      throw new BadRequestException(`Tài khoản chỉ được mua tối đa ${maxSvipPerUser} vé SVIP.`);
    }

    // 2. Atomic Lock cho ghế cụ thể sử dụng HSETNX
    // Nếu ghế đã có chủ (HSETNX trả về 0), báo lỗi ngay.
    // Nếu chưa, gán cho userId hiện tại (trả về 1).
    const isAcquired = await this.redis.hsetnx(seatHashKey, seatNo, userId);
    if (!isAcquired) {
      await this.redis.decr(userQuotaKey); // Rollback quota nếu giành ghế thất bại
      throw new BadRequestException('Ghế này đã có người đặt trên Redis.');
    }

    // 2.5 DB Sync Write: Cập nhật Database đồng bộ để chặn Data Loss
    const dbUpdate = await this.seatInventoryRepo.update(
      { seatNo, concert_id, status: 'AVAILABLE' },
      { status: 'RESERVED', reservedBy: userId, expiryTime: new Date(Date.now() + 5 * 60 * 1000) } // 5 mins
    );

    if (dbUpdate.affected === 0) {
      // Rollback Redis vì DB báo ghế đã có người đặt
      await this.redis.hdel(seatHashKey, seatNo);
      await this.redis.decr(userQuotaKey);
      
      // Repair sync: DB state might be out of sync with Redis
      const actualDbSeat = await this.seatInventoryRepo.findOne({ where: { seatNo, concert_id } });
      if (actualDbSeat) {
        this.logger.warn(`[Sync Warning] Redis hold failed sync for ${seatNo}. DB state: ${actualDbSeat.status} by ${actualDbSeat.reservedBy}`);
        if (actualDbSeat.status === 'BOOKED' && actualDbSeat.reservedBy) {
          await this.redis.hset(seatHashKey, seatNo, `${actualDbSeat.reservedBy}:PAID`);
        }
      }
      throw new BadRequestException('Thao tác không hợp lệ, ghế đã được đặt theo Database.');
    }

    // Gửi event broadcast cho tất cả client để cập nhật ghế trên sơ đồ thành màu tím (held)
    this.sseService.broadcast({ concert_id, seatNo, status: 'held', userId, message: `Ghế SVIP ${seatNo} đang được giữ.` });
    
    // Gửi thông báo riêng tư cho người vừa đặt (Opt-in)
    this.sseService.notifyClient(userId, { type: 'message', message: `Giữ ghế SVIP ${seatNo} thành công, vui lòng thanh toán trong 30 giây.` });

    // 3. Đẩy vào RabbitMQ Wait Queue (Delayed Message giả lập qua TTL + DLX)
    // Nếu người dùng không thanh toán sau 30 giây, message này sẽ rớt sang DLQ và tiến hành Rollback
    const payload = JSON.stringify({ concert_id, userId, seatNo, action: 'rollback_seat' });
    this.rabbitChannel.sendToQueue('hold_timeout_wait_5m_queue', Buffer.from(payload));

    return { success: true, seatNo };
  }

  /**
   * Đồng bộ lại toàn bộ trạng thái ghế SVIP từ DB lên Redis
   */
  async repairSeatSync(concert_id: number) {
    this.logger.log(`[Repair Sync] Bắt đầu đồng bộ lại trạng thái ghế cho show ${concert_id}`);
    const dbSeats = await this.seatInventoryRepo.find({ where: { concert_id } });
    const pipeline = this.redis.pipeline();
    const seatHashKey = `concert:${concert_id}:svip_seats`;

    for (const seat of dbSeats) {
      if (seat.status === 'BOOKED' && seat.reservedBy) {
        pipeline.hset(seatHashKey, seat.seatNo, `${seat.reservedBy}:PAID`);
      } else if (seat.status === 'RESERVED' && seat.reservedBy) {
        // Kiểm tra xem Redis có giữ đúng người không, nếu không thì ghi đè
        pipeline.hset(seatHashKey, seat.seatNo, seat.reservedBy);
      } else if (seat.status === 'AVAILABLE') {
        pipeline.hdel(seatHashKey, seat.seatNo);
      }
    }
    await pipeline.exec();
    this.logger.log(`[Repair Sync] Đồng bộ hoàn tất cho show ${concert_id}`);
  }

  // API Mô phỏng thanh toán (DEPRECATED - Chuyển sang PaymentModule)
  /**
   * @deprecated Sử dụng PaymentController.createOrder và captureOrder thay thế
   */
  async payTickets(concert_id: number, userId: string, payload: any) {
    this.logger.warn(`[Deprecated] Gọi hàm payTickets cũ. Vui lòng chuyển sang dùng PaymentModule.`);
    throw new BadRequestException('Endpoint thanh toán cũ đã bị vô hiệu hóa. Vui lòng cập nhật ứng dụng.');
  }

  /**
   * Cơ chế Phòng chờ ảo (Virtual Waiting Room) với Sức chứa Động
   */
  async enterQueue(userId: string, concert_id: number) {
    // 1. Kiểm tra xem user đã có Booking Pass hợp lệ chưa
    const passKey = `booking_pass:${concert_id}:${userId}`;
    const existingPass = await this.redis.get(passKey);
    if (existingPass) {
      const ttl = await this.redis.ttl(passKey);
      return { status: 'SUCCESS', message: 'Bạn đã có Giấy thông hành hợp lệ!', ttl };
    }

    // 2. Tính toán sức chứa động (Dynamic Capacity) = 1.5 * Tổng số vé của concert
    let maxRoomCapacity = 900;
    try {
      const svipCount = await this.seatInventoryRepo.count({ where: { concert_id } });
      const zoneSum = await this.zoneInventoryRepo.createQueryBuilder('z')
        .where('z.concert_id = :cid', { cid: concert_id })
        .select('SUM(z.totalCapacity)', 'total')
        .getRawOne();
      const totalTickets = (svipCount || 200) + (parseInt(zoneSum?.total || '400', 10));
      maxRoomCapacity = Math.max(100, Math.floor(totalTickets * 1.5));
    } catch (e) {
      this.logger.warn(`Không lấy được tổng số vé từ DB cho show ${concert_id}, dùng mặc định 900.`);
    }

    // 3. Kiểm tra số lượng người đang trong phòng chọn ghế
    const activeUsersKey = `active_booking_users:${concert_id}`;
    const currentActive = parseInt(await this.redis.get(activeUsersKey) || '0', 10);

    if (currentActive < maxRoomCapacity) {
      // Cho phép vào phòng: Cấp Booking Pass (hạn 5 phút) và tăng counter
      await this.redis.set(passKey, 'true', 'EX', 300); // 300s = 5 phút
      await this.redis.incr(activeUsersKey);

      // Hết 5 phút tự động giảm active_booking_users để nhường chỗ cho người đợi
      setTimeout(async () => {
        try {
          const val = await this.redis.decr(activeUsersKey);
          if (val < 0) await this.redis.set(activeUsersKey, '0');
          await this.processNextInQueue(concert_id);
        } catch (err) {}
      }, 300000);

      return { status: 'SUCCESS', message: 'Chào mừng bạn vào phòng chọn ghế!', ttl: 300 };
    } else {
      // Đầy phòng -> Đẩy vào Hàng đợi (Waiting Queue)
      const queueKey = `waiting_queue:${concert_id}`;
      
      // Kiểm tra xem user đã xếp hàng chưa
      const queueList = await this.redis.lrange(queueKey, 0, -1);
      let position = queueList.indexOf(userId);
      if (position === -1) {
        await this.redis.rpush(queueKey, userId);
        position = (await this.redis.llen(queueKey)) - 1;
      }

      return {
        status: 'WAITING',
        position: position + 1, // 1-indexed cho UI
        message: 'Phòng chọn ghế đang đầy. Vui lòng giữ trình duyệt, vị trí của bạn đang được cập nhật.',
      };
    }
  }

  // Bốc người tiếp theo từ hàng đợi vào phòng chọn ghế
  async processNextInQueue(concert_id: number) {
    const queueKey = `waiting_queue:${concert_id}`;
    const nextUserId = await this.redis.lpop(queueKey);
    if (nextUserId) {
      const passKey = `booking_pass:${concert_id}:${nextUserId}`;
      await this.redis.set(passKey, 'true', 'EX', 300);
      await this.redis.incr(`active_booking_users:${concert_id}`);
      this.sseService.notifyClient(nextUserId, { type: 'QUEUE_SUCCESS', message: 'Đã đến lượt bạn! Đang chuyển vào phòng chọn ghế...' });
    }
  }
}
