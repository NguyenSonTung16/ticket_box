import { Injectable, Inject, Logger } from '@nestjs/common';
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

import { ArtistBio } from '../ai/entities/artist-bio.entity';

/**
 * InfoService — Legacy read-only service for the original show list/detail endpoints.
 * New event management (CRUD wizard) is handled by EventService in the event/ module.
 *
 * Endpoints still served:
 *   GET /info/shows       → all active concerts (basic list)
 *   GET /info/show/:id    → full show detail with zones
 */
@Injectable()
export class InfoService {
  private readonly logger = new Logger(InfoService.name);
  private activePromises = new Map<string, Promise<any>>(); // SingleFlight pattern
  private showCache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL
  private inventoryCache = new NodeCache({ stdTTL: 1 }); // 1 second TTL

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(Concert) private readonly showRepo: Repository<Concert>,
    @InjectRepository(ZoneInventory) private readonly zoneRepo: Repository<ZoneInventory>,
    @InjectModel(ShowInfo.name) private readonly showInfoModel: Model<ShowInfoDocument>,
    @InjectRepository(ArtistBio) private readonly artistBioRepo: Repository<ArtistBio>,

  ) {}

  // Lấy danh sách tất cả các show (ACTIVE status)
  async getAllShows() {
    const cacheKey = 'all_shows';

    let redisData: string | null = null;
    try {
      redisData = await this.redis.get(cacheKey);
    } catch (error) {
      this.logger.error(`[Redis Error] Failed to get all_shows: ${error.message}`);
    }

    if (redisData) {
      const parsed = JSON.parse(redisData);
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
          return parsed;
        }

        const postgresShows = await this.showRepo.find({ where: { status: 'ACTIVE' } });
        const mongoInfos = await this.showInfoModel.find().lean();

        // Join PG + Mongo data
        const finalData = postgresShows.map(show => {
          const info = mongoInfos.find(i => i['showId'] === show.id);
          return {
            id: show.id,
            slug: show.slug,
            performanceDate: show.performanceDate,
            status: show.status,
            name: info?.['name'] ?? null,
            venue_name: info?.['venue_name'] ?? null,
            province: info?.['province'] ?? null,
            image_url: info?.['image_url'] ?? null,
            cover_image_url: info?.['cover_image_url'] ?? null,
            category: info?.['category'] ?? null,
            description: info?.['description'] ?? null,
          };
        });

        try {
          await this.redis.set(cacheKey, JSON.stringify(finalData), 'EX', 60);
        } catch (e) {}
        return finalData;
      } finally {
        this.activePromises.delete(cacheKey);
      }
    })();
    this.activePromises.set(cacheKey, promise);
    return promise;
  }

  // Lấy thông tin Show với Cache-Aside và SingleFlight (Mutex Lock cục bộ)
  async getShowInfo(showId: number) {
    const cacheKey = `show_info:${showId}`;

    // 1. Kiểm tra trên Redis (Cache-Aside)
    const redisData = await this.redis.get(cacheKey);
    if (redisData) {
      return JSON.parse(redisData);
    }

    // 2. SingleFlight Pattern: Tránh Cache Stampede khi Cache Miss
    if (this.activePromises.has(cacheKey)) {
      return this.activePromises.get(cacheKey);
    }

    const promise = (async () => {
      try {
        const doubleCheck = await this.redis.get(cacheKey);
        if (doubleCheck) return JSON.parse(doubleCheck);

        // 3. Phân tách DB: Truy vấn đồng thời PostgreSQL và MongoDB
        const [postgresData, postgresZones, mongoData] = await Promise.all([
          this.showRepo.findOne({ where: { id: showId } }),
          this.zoneRepo.find({ where: { concert_id: showId } }),
          this.showInfoModel.findOne({ showId }).lean(),
        ]);

        const zones = postgresZones.map(pz => ({
          zone: pz.zone,
          price: pz.price,
          totalCapacity: pz.totalCapacity,
          availableSlots: pz.availableSlots,
          ticketLimit: pz.ticketLimit,
        }));

        const artistIds = mongoData?.['artist_ids'] || [];
        let artists = [];
        if (artistIds.length > 0) {
          const fetchedArtists = await this.artistBioRepo.createQueryBuilder('artist')
            .where('artist.id IN (:...ids)', { ids: artistIds })
            .getMany();
          artists = fetchedArtists.map(a => ({
            id: a.id,
            name: a.artistName || a.stageName,
            stageName: a.stageName,
            avatarUrl: a.avatarUrl,
            shortBio: a.shortBio,
            category: a.category,
            genres: a.genres,
          }));
        }

        const finalData = {
          id: showId,
          slug: postgresData?.slug || null,
          name: mongoData?.['name'] || null,
          performanceDate: postgresData?.performanceDate,
          venue_name: mongoData?.['venue_name'] || null,
          province: mongoData?.['province'] || null,
          description: mongoData?.['description'],
          category: mongoData?.['category'],
          image_url: mongoData?.['image_url'],
          cover_image_url: mongoData?.['cover_image_url'],
          organizer_name: mongoData?.['organizer_name'],
          organizer_info: mongoData?.['organizer_info'],
          organizer_logo_url: mongoData?.['organizer_logo_url'],
          artistBio: mongoData?.['artistBio'],
          privacy: mongoData?.['privacy'] || 'PUBLIC',
          artist_ids: artistIds,
          artists,
          address_type: mongoData?.['address_type'] || 'OFFLINE',
          ward: mongoData?.['ward'],
          street: mongoData?.['street'],
          confirmation_message: mongoData?.['confirmation_message'],
          bank_account_name: mongoData?.['bank_account_name'],
          bank_account_number: mongoData?.['bank_account_number'],
          bank_name: mongoData?.['bank_name'],
          bank_branch: mongoData?.['bank_branch'],
          vat_business_type: mongoData?.['vat_business_type'],
          vat_full_name: mongoData?.['vat_full_name'],
          vat_address: mongoData?.['vat_address'],
          vat_tax_code: mongoData?.['vat_tax_code'],
          zones,
        };

        await this.redis.set(cacheKey, JSON.stringify(finalData), 'EX', 60);
        return finalData;
      } finally {
        this.activePromises.delete(cacheKey);
      }
    })();

    this.activePromises.set(cacheKey, promise);
    return promise;
  }
}
