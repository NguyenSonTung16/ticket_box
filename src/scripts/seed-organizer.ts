import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Concert, ConcertStatus } from '../info/entities/concert.entity';
import { EventTicketType } from '../info/entities/event-ticket-type.entity';
import { ArtistBio } from '../ai/entities/artist-bio.entity';
import { getModelToken } from '@nestjs/mongoose';
import { ShowInfo } from '../info/schemas/show-info.schema';
import { Model } from 'mongoose';
import { REDIS_CLIENT } from '../config/redis.config';
import { MEILISEARCH_CLIENT } from '../config/meilisearch.config';
import { Invoice } from '../booking/entities/invoice.entity';
import { Ticket } from '../booking/entities/ticket.entity';
import * as crypto from 'crypto';

async function bootstrap() {
  console.log('Bắt đầu dọn dẹp và Seed Data cho Organizer...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get(getRepositoryToken(User));
  const concertRepo = app.get(getRepositoryToken(Concert));
  const ticketTypeRepo = app.get(getRepositoryToken(EventTicketType));
  const artistBioRepo = app.get(getRepositoryToken(ArtistBio));
  const invoiceRepo = app.get(getRepositoryToken(Invoice));
  const ticketRepo = app.get(getRepositoryToken(Ticket));
  const showInfoModel = app.get<Model<ShowInfo>>(getModelToken(ShowInfo.name));
  
  const redisClient = app.get(REDIS_CLIENT);
  const meiliClient = app.get(MEILISEARCH_CLIENT);

  // 1. Dọn dẹp dữ liệu cũ (Xóa toàn bộ sự kiện và thông tin rác)
  console.log('1. Đang dọn dẹp dữ liệu rác...');
  await showInfoModel.deleteMany({});
  await ticketRepo.query('DELETE FROM tickets');
  await invoiceRepo.query('DELETE FROM invoices');
  await ticketTypeRepo.query('DELETE FROM event_ticket_types');
  await concertRepo.query('DELETE FROM concerts');
  // Xóa Redis cache
  const keys = await redisClient.keys('draft:*');
  if (keys.length > 0) await redisClient.del(...keys);
  await redisClient.del('all_shows');
  
  try {
    await meiliClient.index('shows').deleteAllDocuments();
  } catch (e) {
    console.log('Meilisearch index not found or empty.');
  }

  // 2. Postgres Seed: Lấy tất cả Users
  let users = await userRepository.find();
  if (users.length === 0) {
    const newUser = userRepository.create({ email: 'admin@ticketbox.com', passwordHash: 'hashed_password' });
    await userRepository.save(newUser);
    users = [newUser];
  }
  console.log(`Đã tìm thấy ${users.length} Users, sẽ gán sự kiện mẫu cho tất cả.`);

  // 3. Seed: Danh sách Nghệ sĩ (ArtistBio)
  console.log('2. Đang nạp danh sách Nghệ sĩ...');
  await artistBioRepo.query('DELETE FROM artist_bios');
  const artists = [
    artistBioRepo.create({ stageName: 'Sơn Tùng M-TP', artistName: 'Nguyễn Thanh Tùng', category: 'Ca sĩ', avatarUrl: 'https://images.unsplash.com/photo-1516280440502-6c5c7d0d01ba?q=80&w=200&auto=format&fit=crop', shortBio: 'Nam ca sĩ hàng đầu Việt Nam.', mediumBio: '...', seoBio: '...', status: 'APPROVED' }),
    artistBioRepo.create({ stageName: 'Đen Vâu', artistName: 'Nguyễn Đức Cường', category: 'Rapper', avatarUrl: 'https://images.unsplash.com/photo-1520446266423-6daca23fe8c7?q=80&w=200&auto=format&fit=crop', shortBio: 'Rapper đình đám với những bản hit triệu view.', mediumBio: '...', seoBio: '...', status: 'APPROVED' }),
    artistBioRepo.create({ stageName: 'HIEUTHUHAI', artistName: 'Trần Minh Hiếu', category: 'Rapper', avatarUrl: 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?q=80&w=200&auto=format&fit=crop', shortBio: 'Rapper trẻ đầy triển vọng.', mediumBio: '...', seoBio: '...', status: 'APPROVED' }),
    artistBioRepo.create({ stageName: 'Hoàng Dùy', artistName: 'Hoàng Dùy', category: 'Ca sĩ', avatarUrl: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?q=80&w=200&auto=format&fit=crop', shortBio: 'Ca sĩ trẻ tài năng.', mediumBio: '...', seoBio: '...', status: 'APPROVED' })
  ];
  await artistBioRepo.save(artists);

  // 4. Seed: Sự kiện mẫu
  console.log('3. Đang nạp Sự kiện mẫu...');

  let concertSlug = '';
  for (const admin of users) {
    // Sự kiện 1: Đang bán (ACTIVE)
    const concert1 = concertRepo.create({
      organizer_id: admin.id,
      slug: `anh-trai-say-hi-live-concert-2026-${admin.id.substring(0, 5)}`,
      performanceDate: new Date('2026-10-10T20:00:00Z'),
      status: ConcertStatus.ACTIVE,
      current_step: 4
    });
    await concertRepo.save(concert1);
    concertSlug = concert1.slug;

    await showInfoModel.create({
      showId: concert1.id,
      name: 'Anh Trai Say Hi - Live Concert',
      category: 'Âm nhạc',
      address_type: 'OFFLINE',
      venue_name: 'Sân Vận Động Mỹ Đình',
      province: 'Hà Nội',
      ward: 'Mỹ Đình',
      street: 'Lê Đức Thọ',
      image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop',
      cover_image_url: 'https://images.unsplash.com/photo-1540039155733-d7696d487346?q=80&w=1200&auto=format&fit=crop',
      organizer_name: 'TicketBox Entertainment',
      organizer_info: 'Nhà tổ chức sự kiện âm nhạc hàng đầu',
      organizer_logo_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop',
      description: 'Bữa tiệc âm nhạc hoành tráng nhất năm 2026 quy tụ các anh trai cực phẩm.',
      artist_ids: [artists[0].id, artists[2].id],
      privacy: 'PUBLIC',
      bank_account_name: 'TICKETBOX CO LTD',
      bank_account_number: '123456789',
      bank_name: 'Vietcombank'
    });

    // Ticket Types cho Sự kiện 1
    const tt1 = ticketTypeRepo.create({ showId: concert1.id, name: 'VIP', price: 2000000, total_quantity: 500, is_free: false, sort_order: 1 });
    const tt2 = ticketTypeRepo.create({ showId: concert1.id, name: 'GA', price: 800000, total_quantity: 2000, is_free: false, sort_order: 2 });
    await ticketTypeRepo.save([tt1, tt2]);

    // Seed Transactions/Bookings (Mua vé ảo để hiển thị Tickets Sold)
    const invoice1 = invoiceRepo.create({
      id: crypto.randomUUID(),
      userId: admin.id,
      concert_id: concert1.id,
      totalAmount: 4000000,
      status: 'PAID'
    });
    await invoiceRepo.save(invoice1);

    const t1 = ticketRepo.create({ concert_id: concert1.id, price: 2000000, status: 'valid', invoice: invoice1, zone: 'VIP' });
    const t2 = ticketRepo.create({ concert_id: concert1.id, price: 2000000, status: 'valid', invoice: invoice1, zone: 'VIP' });
    await ticketRepo.save([t1, t2]);

    const invoice2 = invoiceRepo.create({
      id: crypto.randomUUID(),
      userId: admin.id,
      concert_id: concert1.id,
      totalAmount: 800000,
      status: 'PAID'
    });
    await invoiceRepo.save(invoice2);
    const t3 = ticketRepo.create({ concert_id: concert1.id, price: 800000, status: 'valid', invoice: invoice2, zone: 'GA' });
    await ticketRepo.save(t3);

    // Sự kiện 2: Nháp (DRAFT)
    const concert2 = concertRepo.create({
      organizer_id: admin.id,
      slug: `rap-viet-all-star-2026-${admin.id.substring(0, 5)}`,
      status: ConcertStatus.DRAFT,
      current_step: 1
    });
    await concertRepo.save(concert2);

    await showInfoModel.create({
      showId: concert2.id,
      name: 'Rap Việt All Star 2026',
      category: 'Âm nhạc',
      address_type: 'OFFLINE',
      venue_name: 'SECC Quận 7',
      province: 'Hồ Chí Minh',
      image_url: 'https://images.unsplash.com/photo-1470229722913-7c092fb1f692?q=80&w=1200&auto=format&fit=crop',
      cover_image_url: 'https://images.unsplash.com/photo-1470229722913-7c092fb1f692?q=80&w=1200&auto=format&fit=crop',
      organizer_name: 'TicketBox Entertainment',
      description: 'Chưa hoàn thiện...',
      privacy: 'PRIVATE'
    });
  }

  // 5. Nạp vào Meilisearch
  const index = meiliClient.index('shows');
  await index.addDocuments([
    { id: concertSlug, name: 'Anh Trai Say Hi - Live Concert', location: 'Hà Nội', date: '2026-10-10' },
  ]);

  console.log('Hoàn tất toàn bộ quy trình Seed Organizer!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Lỗi khi Seed Data:', err);
  process.exit(1);
});
