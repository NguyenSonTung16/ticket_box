import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User } from '../auth/entities/user.entity';
import { Concert } from '../info/entities/concert.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import { ZoneInventory } from '../booking/entities/zone-inventory.entity';
import { DEV_PRIVATE_KEY } from '../checkin/checkin.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShowInfo, ShowInfoDocument } from '../info/schemas/show-info.schema';

async function bootstrap() {
  console.log('--- KHỞI CHẠY SEED DỮ LIỆU ĐĂNG NHẬP & SOÁT VÉ ---');
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const concertRepo = app.get<Repository<Concert>>(getRepositoryToken(Concert));
  const ticketRepo = app.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  const zoneRepo = app.get<Repository<ZoneInventory>>(getRepositoryToken(ZoneInventory));

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const usersToSeed = [
    { email: 'admin@ticketbox.com', role: 'ADMIN', status: 'ACTIVE' },
    { email: 'organizer@ticketbox.com', role: 'ORGANIZER', status: 'ACTIVE' },
    { email: 'staff@ticketbox.com', role: 'CHECKIN_STAFF', status: 'ACTIVE' },
    { email: 'user@ticketbox.com', role: 'USER', status: 'ACTIVE' },
    { email: 'locked@ticketbox.com', role: 'USER', status: 'LOCKED' },
  ];

  for (const item of usersToSeed) {
    let u = await userRepo.findOne({ where: { email: item.email } });
    if (!u) {
      u = userRepo.create({
        email: item.email,
        passwordHash,
        role: item.role,
        status: item.status,
      });
      await userRepo.save(u);
      console.log(`[POSTGRES] Đã tạo User: ${item.email} (${item.role}) - Mật khẩu: Password123!`);
    } else {
      u.role = item.role;
      u.status = item.status;
      u.passwordHash = passwordHash;
      await userRepo.save(u);
      console.log(`[POSTGRES] Đã cập nhật User: ${item.email} (${item.role}) - Mật khẩu: Password123!`);
    }
  }

  // 2. Seed Concert (ID = 1)
  let concert = await concertRepo.findOne({ where: { id: 1 } });
  if (!concert) {
    concert = concertRepo.create({
      id: 1,
      organizer_id: '11111111-1111-1111-1111-111111111111',
      performanceDate: new Date('2026-10-10T19:00:00Z'),
      status: 'ACTIVE',
      slug: 'anh-trai-say-hi-2026',
      current_step: 4,
    });
    await concertRepo.save(concert);
    console.log('[POSTGRES] Đã tạo Concert ID = 1.');
  }

  // 2.5. Seed MongoDB ShowInfo for Concert 1
  const showInfoModel = app.get(getModelToken(ShowInfo.name));
  const showInfo = await showInfoModel.findOne({ showId: 1 });
  if (!showInfo) {
    await showInfoModel.create({
      showId: 1,
      name: 'Anh Trai Say Hi Concert',
      category: 'Singer',
      venue_name: 'Sân vận động Mỹ Đình',
      province: 'Hà Nội',
      image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600',
      organizer_name: 'TicketBox Entertainment',
      description: 'Đại nhạc hội Anh Trai Say Hi Live Concert 2026',
    });
    console.log('[MONGO] Đã tạo ShowInfo mặc định cho showId = 1.');
  }

  // 3. Seed Zone
  let zone = await zoneRepo.findOne({ where: { concert_id: 1, zone: 'SVIP' } });
  if (!zone) {
    zone = zoneRepo.create({
      concert_id: 1,
      zone: 'SVIP',
      price: 2500000,
      totalCapacity: 100,
      availableSlots: 97,
    });
    await zoneRepo.save(zone);
    console.log('[POSTGRES] Đã tạo Zone SVIP cho Concert 1.');
  }

  // 4. Seed Tickets with signatures
  const ticketIdValid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const ticketIdCheckedIn = '8b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const ticketIdRefunded = '7b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

  const concertId = '1';
  const seatInfo = 'SVIP-A-12';
  const issuedAt = 1717848000;

  // Generate valid Ed25519 signature using Node's crypto
  const message = `${ticketIdValid}.${concertId}.${seatInfo}.${issuedAt}`;
  const privateKeyPem = process.env.ED25519_PRIVATE_KEY || DEV_PRIVATE_KEY;
  const signature = crypto.sign(null, Buffer.from(message, 'utf8'), privateKeyPem).toString('base64url');

  const ticketsToSeed = [
    { id: ticketIdValid, concert_id: 1, seatNo: seatInfo, zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: ticketIdCheckedIn, concert_id: 1, seatNo: 'SVIP-A-13', zone: 'SVIP', price: 2500000, status: 'checked_in' },
    { id: ticketIdRefunded, concert_id: 1, seatNo: 'SVIP-A-14', zone: 'SVIP', price: 2500000, status: 'refunded' },
    { id: '1a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-01', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '2b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-02', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '3c3deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-03', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '4d4deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-04', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '5e5deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-05', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '6f6deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-06', zone: 'SVIP', price: 2500000, status: 'valid' },
    { id: '7a7deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-07', zone: 'SVIP', price: 2500000, status: 'invalid' },
    { id: '8b8deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', concert_id: 1, seatNo: 'SVIP-B-08', zone: 'SVIP', price: 2500000, status: 'refunded' },
  ];

  for (const t of ticketsToSeed) {
    let ticket = await ticketRepo.findOne({ where: { id: t.id } });
    if (!ticket) {
      ticket = ticketRepo.create(t);
      await ticketRepo.save(ticket);
    } else {
      ticket.status = t.status;
      await ticketRepo.save(ticket);
    }
  }

  console.log('\n======================================================');
  console.log('DANH SÁCH PAYLOAD MẪU ĐỂ SOÁT VÉ (TEST CHECK-IN):');
  console.log('======================================================');
  console.log(`1. Vé hợp lệ (Status: valid):`);
  console.log(`- Request POST: /api/checkin/verify`);
  console.log(`- Payload Body:`);
  console.log(JSON.stringify({
    ticketId: ticketIdValid,
    concertId: concertId,
    seatInfo: seatInfo,
    issuedAt: issuedAt,
    signature: signature
  }, null, 2));
  console.log('\n2. Vé đã quét (Status: checked_in):');
  console.log(`- Request POST: /api/checkin/verify`);
  console.log(`- Payload Body:`);
  console.log(JSON.stringify({
    ticketId: ticketIdCheckedIn,
    concertId: concertId,
    seatInfo: 'SVIP-A-13',
    issuedAt: issuedAt,
    signature: 'any_dummy_sig'
  }, null, 2));
  console.log('\n3. Vé hoàn tiền (Status: refunded):');
  console.log(`- Request POST: /api/checkin/verify`);
  console.log(`- Payload Body:`);
  console.log(JSON.stringify({
    ticketId: ticketIdRefunded,
    concertId: concertId,
    seatInfo: 'SVIP-A-14',
    issuedAt: issuedAt,
    signature: 'any_dummy_sig'
  }, null, 2));
  console.log('======================================================\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Lỗi khi chạy seed:', err);
  process.exit(1);
});
