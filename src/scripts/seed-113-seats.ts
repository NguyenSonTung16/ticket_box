import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeatInventory } from '../booking/entities/seat-inventory.entity';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seatRepo = app.get(getRepositoryToken(SeatInventory));

  const csvPath = path.join(process.cwd(), 'generated_vip_guests.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const seatNos = lines.slice(1).filter(l => l.trim()).map(l => l.split(',')[0]);

  const concertId = 117;
  console.log(`Bắt đầu tạo ${seatNos.length} ghế cho sự kiện ID: ${concertId}...`);

  // Xóa ghế cũ của show 113 nếu có để tránh duplicate
  await seatRepo.query(`DELETE FROM seat_inventory WHERE concert_id = $1`, [concertId]);

  const batchSize = 100;
  for (let i = 0; i < seatNos.length; i += batchSize) {
    const batch = seatNos.slice(i, i + batchSize);
    const seatsToInsert = batch.map(seatNo => ({
      concert_id: concertId,
      zone: seatNo.includes('SVIP') ? 'SVIP' : seatNo.includes('VVIP') ? 'VVIP' : 'VIP',
      seatNo: seatNo,
      status: 'AVAILABLE',
      price: 2000000,
      sponsorId: 'default-sponsor'
    }));
    await seatRepo.save(seatsToInsert);
    console.log(`Đã insert batch ${i / batchSize + 1}`);
  }

  console.log('Tạo ghế thành công!');
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
