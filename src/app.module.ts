import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RedisModule } from './config/redis.config';
import { RabbitMQModule } from './config/rabbitmq.config';
import { MeilisearchModule } from './config/meilisearch.config';
import { typeOrmConfig } from './config/database.config';
import { MinioModule } from './minio/minio.module';

import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { InfoModule } from './info/info.module';
import { EventModule } from './event/event.module';
import { GuestModule } from './guest/guest.module';
import { PaymentModule } from './payment/payment.module';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoConfig } from './config/mongo.config';
import { CheckinModule } from './checkin/checkin.module';
import { AiModule } from './ai/ai.module';
import { WorkerModule } from './worker/worker.module';

const coreModules = [
  ConfigModule.forRoot(),
  TypeOrmModule.forRoot(typeOrmConfig),
  MongooseModule.forRoot(mongoConfig.uri),
  ScheduleModule.forRoot(),
  RedisModule,
  RabbitMQModule,
  MeilisearchModule,
  NotificationsModule,
  // MinIO object storage — global module, MinioService available everywhere
  MinioModule,
  // Serve frontend client
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'ticketbox-client', 'dist'),
    serveRoot: '/',
    exclude: ['/api*', '/uploads*'],
  }),
  // @deprecated: local-disk image serving — will be removed in Phase 4 once
  // all image_url fields point to MinIO object keys instead of /uploads/ paths.
  ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'uploads'),
    serveRoot: '/uploads',
  }),
];

let serviceModules = [];
const serviceName = process.env.SERVICE_NAME;

if (serviceName === 'auth') {
  serviceModules = [AuthModule];
} else if (serviceName === 'booking') {
  serviceModules = [BookingModule];
} else if (serviceName === 'info') {
  serviceModules = [InfoModule, EventModule, SearchModule];
} else if (serviceName === 'guest') {
  serviceModules = [GuestModule];
} else if (serviceName === 'event') {
  serviceModules = [EventModule];
} else if (serviceName === 'payment') {
  serviceModules = [PaymentModule];
} else if (serviceName === 'checkin') {
  serviceModules = [CheckinModule];
} else if (serviceName === 'ai') {
  serviceModules = [AiModule, AuthModule];
} else if (serviceName === 'worker') {
  serviceModules = [WorkerModule, GuestModule, NotificationsModule];
} else {
  // Monolithic fallback
  serviceModules = [
    AuthModule,
    BookingModule,
    InfoModule,
    EventModule,
    SearchModule,
    GuestModule,
    PaymentModule,
    CheckinModule,
    AiModule,
    WorkerModule,
    NotificationsModule,
  ];
}

@Module({
  imports: [...coreModules, ...serviceModules],
})
export class AppModule {}
