import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeatInventory } from '../booking/entities/seat-inventory.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seatRepo = app.get(getRepositoryToken(SeatInventory));

  await seatRepo.query(`UPDATE seat_inventory SET "sponsorId" = '1' WHERE concert_id = 117`);

  console.log('Update sponsorId thành công!');
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
