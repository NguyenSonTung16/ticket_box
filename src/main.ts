import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Bật CORS cho phép kết nối linh hoạt
  app.enableCors();

  // Cấu hình phục vụ file Static (Vite Build) từ thư mục ticketbox-client/dist
  app.useStaticAssets(join(__dirname, '..', 'ticketbox-client', 'dist'));

  // Middleware to log request, add X-Served-By header for load balancing verification
  app.use((req, res, next) => {
    const port = process.env.PORT || 3000;
    const serviceName = process.env.SERVICE_NAME || 'app';
    res.setHeader('X-Served-By', `${serviceName}-${port}`);
    console.log(`[${serviceName}:${port}] ${req.method} ${req.url}`);
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n===============================================================`);
  console.log(`🚀 API Server: http://localhost:${port} | Container: ${os.hostname()}`);
  console.log(`===============================================================\n`);
}
bootstrap();
