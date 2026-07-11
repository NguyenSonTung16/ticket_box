import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { REDIS_CLIENT } from '../config/redis.config';
import { MEILISEARCH_CLIENT } from '../config/meilisearch.config';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
const csv = require('csv-parser');

async function bootstrap() {
  console.log('Bắt đầu Seed Data...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get(getRepositoryToken(User));
  const redisClient = app.get(REDIS_CLIENT);
  const meiliClient = app.get(MEILISEARCH_CLIENT);

  // 1. Postgres Seed: Tạo user
  const adminEmail = 'admin@ticketbox.com';
  let admin = await userRepository.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = userRepository.create({ email: adminEmail, passwordHash: 'hashed_password' });
    await userRepository.save(admin);
    console.log('Đã tạo Admin User trong Postgres.');
  }

  const dummyConcerts = [
    { id: 1, name: 'Anh Trai Say Hi - Live Concert', location: 'Hà Nội', performanceDate: new Date('2026-10-10') },
    { id: 2, name: 'Rap Việt All Star', location: 'TPHCM', performanceDate: new Date('2026-11-20') },
    { id: 3, name: 'Đen Vâu - Show Của Đen', location: 'Đà Nẵng', performanceDate: new Date('2026-12-05') },
    { id: 4, name: 'Anh Trai "Say Hi" 2025', location: 'Hà Nội', performanceDate: new Date('2026-12-20') },
  ];

  const { Concert } = require('../info/entities/concert.entity');
  const concertRepository = app.get(getRepositoryToken(Concert));
  const { ShowInfo } = require('../info/schemas/show-info.schema');
  const showInfoModel = app.get(getModelToken(ShowInfo.name));
  const { SeatInventory } = require('../booking/entities/seat-inventory.entity');
  const { ZoneInventory } = require('../booking/entities/zone-inventory.entity');
  const seatInventoryRepo = app.get(getRepositoryToken(SeatInventory));
  const zoneInventoryRepo = app.get(getRepositoryToken(ZoneInventory));

  // Truncate PG handled manually or previously, let's just make sure Mongo is clear
  console.log('Cleaning MongoDB...');
  await showInfoModel.deleteMany({});

  for (const cData of dummyConcerts) {
    let concert = await concertRepository.findOne({ where: { id: cData.id } });
    if (!concert) {
      concert = concertRepository.create({
        id: cData.id,
        performanceDate: cData.performanceDate,
        status: 'ACTIVE',
        organizer_id: admin.id
      });
      await concertRepository.save(concert);
      console.log(`Đã tạo Concert ID ${cData.id} trong Postgres.`);
    }

    let showInfo = await showInfoModel.findOne({ showId: cData.id });
    if (!showInfo || !showInfo.cover_image_url) {
      if (showInfo) {
         await showInfoModel.deleteOne({ showId: cData.id });
      }
      
      const defaultCoverImages = [
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200"
      ];
      
      const descriptions = [
        "Sự kiện âm nhạc hoành tráng nhất năm với các màn trình diễn đỉnh cao.",
        "Đêm nhạc Rap bùng nổ cùng các Rapper hàng đầu Việt Nam.",
        "Liveshow ấm áp và đầy cảm xúc cùng Đen Vâu và những người bạn.",
        "Đại nhạc hội quy tụ 30 Anh Trai với sân khấu đẳng cấp quốc tế."
      ];
      
      const artistBios = [
        "Nhiều nghệ sĩ nổi tiếng",
        "Top Rapper Việt Nam",
        "Đen Vâu và dàn khách mời",
        "30 Anh Trai hot nhất Vbiz"
      ];

      const categories = [
        "Live Concert",
        "Rap/HipHop",
        "Live Concert",
        "Live Concert"
      ];
      
      const wards = [
        "Phường Mỹ Đình 1",
        "Phường 2",
        "Phường Hòa Cường Bắc",
        "Phường Mỹ Đình 1"
      ];

      const streets = [
        "Đường Lê Đức Thọ",
        "Đường Phan Đình Phùng",
        "Đường 2/9",
        "Đường Lê Đức Thọ"
      ];

      await showInfoModel.create({
        showId: cData.id,
        name: cData.name,
        category: categories[(cData.id - 1) % 4],
        venue_name: cData.location,
        province: cData.location,
        ward: wards[(cData.id - 1) % 4],
        street: streets[(cData.id - 1) % 4],
        address_type: 'OFFLINE',
        privacy: 'PUBLIC',
        image_url: defaultCoverImages[(cData.id - 1) % 4],
        cover_image_url: defaultCoverImages[(cData.id - 1) % 4],
        description: descriptions[(cData.id - 1) % 4],
        artistBio: artistBios[(cData.id - 1) % 4],
        organizer_name: "TicketBox Entertainment",
        organizer_info: "Đơn vị tổ chức sự kiện hàng đầu Việt Nam.",
        organizer_logo_url: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200",
        confirmation_message: "Cảm ơn bạn đã đặt vé. Hẹn gặp lại bạn tại sự kiện!",
        bank_account_name: "TICKETBOX JSC",
        bank_account_number: "19036789012345",
        bank_name: "Techcombank",
        bank_branch: "Chi nhánh Hà Nội",
        vat_business_type: "COMPANY",
        vat_full_name: "Công ty CP TicketBox",
        vat_address: "Tầng 1, Tòa nhà ABC, Hà Nội",
        vat_tax_code: "0101234567"
      });
      console.log(`Đã tạo ShowInfo cho Concert ${cData.id} trong MongoDB.`);
    }

    await zoneInventoryRepo.delete({ concert_id: cData.id });
    
    // Set mức giá khác nhau tùy theo cData.id
    const basePrice = cData.id * 300000; // vd: concert 1 = 300k, concert 2 = 600k...
    
    await zoneInventoryRepo.insert([
      { zone: 'SVIP', concert_id: cData.id, totalCapacity: 40, availableSlots: 40, ticketLimit: 2, price: basePrice + 1500000 },
      { zone: 'VIP', concert_id: cData.id, totalCapacity: 75, availableSlots: 75, ticketLimit: 5, price: basePrice + 700000 },
      { zone: 'Normal', concert_id: cData.id, totalCapacity: 100, availableSlots: 100, ticketLimit: 4, price: basePrice },
    ]);
    console.log(`Đã Seed các zone với mức giá riêng biệt cho Concert ${cData.id} vào Postgres.`);

    // Adapt to new SeatInventory schema
    const seatCount = await seatInventoryRepo.count({ where: { showId: cData.id } });
    if (seatCount === 0) {
      const seats = [];
      const rows = ['A', 'B'];
      const cols = 20;
      for (const row of rows) {
        for (let i = 1; i <= cols; i++) {
          const sponsorId = (cData.id === 1 && row === 'A' && (i === 1 || i === 2)) ? 'sponsor-test' : null;
          seats.push({ row, number: String(i), showId: cData.id, status: 'AVAILABLE', zone: 'SVIP', sponsorId });
        }
      }
      await seatInventoryRepo.insert(seats);
      console.log(`Đã Seed 40 SVIP seats cho Concert ${cData.id} vào Postgres.`);
    }

    // 2. Redis Seed: SVIP Seat Matrix    // Set up Redis keys
    const inventoryKey = `concert:${cData.id}:inventory`;
    const svipHashKey = `concert:${cData.id}:svip_seats`;

    // Xoá dữ liệu cũ
    await redisClient.del(inventoryKey);
    await redisClient.del(svipHashKey);

    // Set vé GA, VIP, CAT, v.v. vào Redis
    const zones = await zoneInventoryRepo.find({ where: { concert_id: cData.id } });
    for (const zone of zones) {
      if (zone.zone !== 'SVIP') {
        await redisClient.hset(inventoryKey, zone.zone, zone.totalCapacity);
      }
    }
    console.log(`Đã nạp vé các khu vực cho Concert ${cData.id} vào Redis.`);
  }

  // Tạo CSV mẫu cho VIP Guest Import
  const csvPath = 'vip_guests.csv';
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, 'seatNo,name,email\nA1,Trấn Thành,tt@email.com\nA2,Sơn Tùng,mtp@email.com\n');
  }

  // 3. Import VIP Guest từ CSV vào Redis SVIP Seats
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(csvPath).pipe(csv());
    const svipHashKey1 = `concert:1:svip_seats`;
    
    stream.on('data', async (row) => {
      // Đặt sẵn vé cho khách mời (Pre-allocate) bằng cách ghi trực tiếp vào HASH
      await redisClient.hset(svipHashKey1, row.seatNo, row.email);
      console.log(`Đã Import khách VIP: Ghế ${row.seatNo} cho ${row.name}`);
    });

    stream.on('end', () => resolve(true));
    stream.on('error', (error) => reject(error));
  });

  // 4. Meilisearch Seed: Dummy shows
  const index = meiliClient.index('shows');
  const dummyShows = [
    { id: '1', name: 'Anh Trai Say Hi - Live Concert', location: 'Hà Nội', date: '2026-10-10' },
    { id: '2', name: 'Rap Việt All Star', location: 'TPHCM', date: '2026-11-20' },
    { id: '3', name: 'Đen Vâu - Show Của Đen', location: 'Đà Nẵng', date: '2026-12-05' },
    { id: '4', name: 'Anh Trai "Say Hi" 2025', location: 'Hà Nội', date: '2026-12-20' },
  ];
  await index.addDocuments(dummyShows);
  console.log('Đã nạp Dummy Shows vào Meilisearch.');

  console.log('Seed Data hoàn tất.');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Lỗi khi Seed Data:', err);
  process.exit(1);
});
