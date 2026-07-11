import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { REDIS_CLIENT } from '../config/redis.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ShowInfo, ShowInfoDocument } from './schemas/show-info.schema';
import { Concert } from './entities/concert.entity';
import { ZoneInventory } from '../booking/entities/zone-inventory.entity';

@Injectable()
export class InfoService implements OnModuleInit {
  private readonly logger = new Logger(InfoService.name);
  private activePromises = new Map<string, Promise<any>>(); // SingleFlight pattern
  private showCache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL
  private inventoryCache = new NodeCache({ stdTTL: 1 }); // 1 second TTL

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(Concert) private readonly showRepo: Repository<Concert>,
    @InjectRepository(ZoneInventory) private readonly zoneRepo: Repository<ZoneInventory>,
    @InjectModel(ShowInfo.name) private readonly showInfoModel: Model<ShowInfoDocument>,
  ) {}

  // =========================================================================
  // SEED DATA (TẠO DỮ LIỆU MẪU)
  // Hàm onModuleInit() này CHỈ chạy một lần duy nhất khi khởi động server.
  // Nếu Database trống, nó sẽ chèn dữ liệu mẫu (hardcode) vào Postgres & MongoDB.
  // Các hàm getAllShows() và getShowInfo() bên dưới SẼ ĐỌC TỪ DATABASE,
  // chứ không đọc từ đống dữ liệu hardcode này.
  // =========================================================================
  async onModuleInit() {
    this.logger.log('InfoService initialized. No auto-seeding will occur.');
  }

  // Lấy danh sách tất cả các show
  async getAllShows() {
    const cacheKey = 'all_shows';
    let shows = this.showCache.get(cacheKey);
    if (shows) return shows;

    let redisData: string | null = null;
    try {
      redisData = await this.redis.get(cacheKey);
    } catch (error) {
      this.logger.error(`[Redis Error] Failed to get all_shows: ${error.message}`);
    }

    if (redisData) {
      const parsed = JSON.parse(redisData);
      this.showCache.set(cacheKey, parsed);
      return parsed;
    }

    if (this.activePromises.has(cacheKey)) {
      return this.activePromises.get(cacheKey);
    }

    const promise = (async () => {
      try {
        let doubleCheck: string | null = null;
        try {
          doubleCheck = await this.redis.get(cacheKey);
        } catch (e) {}

        if (doubleCheck) {
          const parsed = JSON.parse(doubleCheck);
          this.showCache.set(cacheKey, parsed);
          return parsed;
        }

        const postgresShows = await this.showRepo.find();
        const mongoInfos = await this.showInfoModel.find().lean();

        // Nối dữ liệu
        const finalData = postgresShows.map(show => {
          const info = mongoInfos.find(i => i.concert_id === show.id);
          return {
            id: show.id,
            name: show.name,
            performanceDate: show.performanceDate,
            location: show.location,
            status: show.status,
            coverImage: info?.coverImage,
            description: info?.description,
          };
        });

        try {
          await this.redis.set(cacheKey, JSON.stringify(finalData), 'EX', 60);
        } catch (e) {}
        this.showCache.set(cacheKey, finalData);
        return finalData;
      } finally {
        this.activePromises.delete(cacheKey);
      }
    })();
    this.activePromises.set(cacheKey, promise);
    return promise;
  }

  // Lấy thông tin Show với Cache-Aside và SingleFlight (Mutex Lock cục bộ)
  async getShowInfo(concert_id: number) {
    const cacheKey = `concert_info:${concert_id}`;
    let showInfo: any = this.showCache.get(cacheKey);
    
    if (!showInfo) {
      // 1. Kiểm tra trên Redis (Cache-Aside)
      let redisData: string | null = null;
      try {
        redisData = await this.redis.get(cacheKey);
      } catch (error) {
        this.logger.error(`[Redis Error] Failed to get concert_info:${concert_id}: ${error.message}`);
      }

      if (redisData) {
        showInfo = JSON.parse(redisData);
        this.showCache.set(cacheKey, showInfo);
      } else {
      // 2. SingleFlight Pattern: Tránh Cache Stampede khi Cache Miss
      if (this.activePromises.has(cacheKey)) {
        showInfo = await this.activePromises.get(cacheKey);
      } else {
        const promise = (async () => {
          try {
            // Double check phòng khi request đại diện khác vừa nạp vào Redis xong
            let doubleCheck: string | null = null;
            try {
              doubleCheck = await this.redis.get(cacheKey);
            } catch (e) {}
            if (doubleCheck) {
              const parsed = JSON.parse(doubleCheck);
              this.showCache.set(cacheKey, parsed);
              return parsed;
            }

            // 3. Phân tách DB: Truy vấn đồng thời PostgreSQL và MongoDB
            const [postgresData, postgresZones, mongoData] = await Promise.all([
              this.showRepo.findOne({ where: { id: concert_id } }),
              this.zoneRepo.find({ where: { concert_id } }),
              this.showInfoModel.findOne({ concert_id }).lean()
            ]);

            const mongoZones = mongoData?.zoneSetups || [];
            const zones = postgresZones.map(pz => {
              const mz = mongoZones.find(m => m.name === pz.zone);
              return {
                zone: pz.zone,
                price: pz.price,
                totalCapacity: pz.totalCapacity,
                availableSlots: pz.availableSlots,
                color: mz?.color || '#cccccc',
                benefits: mz?.benefits || []
              };
            });

            const finalData = {
              id: concert_id,
              name: postgresData?.name || 'Unknown Show',
              performanceDate: postgresData?.performanceDate,
              location: postgresData?.location,
              description: mongoData?.description,
              artistBio: mongoData?.artistBio,
              rules: mongoData?.rules,
              coverImage: mongoData?.coverImage,
              zones: zones
            };
            
            // 4. Lưu Lên Redis với TTL 300s (5 phút) cho thông tin tĩnh
            try {
              await this.redis.set(cacheKey, JSON.stringify(finalData), 'EX', 300);
            } catch (e) {}
            this.showCache.set(cacheKey, finalData);
            
            return finalData;
          } finally {
            this.activePromises.delete(cacheKey); // Giải phóng Lock
          }
        })();
        this.activePromises.set(cacheKey, promise);
        showInfo = await promise;
      }
    }
    }

    return showInfo;
  }
}
