import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { InfoService } from './src/info/info.service';
import { PaymentService } from './src/payment/payment.service';
import { PaypalClient } from './src/payment/paypal.client';

async function bootstrap() {
  console.log('🚀 Đang khởi động NestJS Application Context (Không mở HTTP Server)...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const infoService = app.get(InfoService);
  const paymentService = app.get(PaymentService);
  const paypalClient = app.get(PaypalClient);

  // MOCK PAYPAL CLIENT ĐỂ KHÔNG CẦN GỌI LÊN MẠNG THẬT
  paypalClient.createOrder = async () => ({ id: `TEST_ORDER_${Date.now()}`, status: 'CREATED' } as any);
  paypalClient.captureOrder = async (id: string) => ({ id, status: 'COMPLETED' } as any);

  try {
    console.log('\n--- BƯỚC 1: LẤY DỮ LIỆU LẦN ĐẦU ĐỂ TẠO CACHE ---');
    let info = await infoService.getShowInfo(1);
    const initialNormal = info.zones.find((z: any) => z.zone === 'Normal').availableSlots;
    console.log(`=> Số vé Normal đang trống trên giao diện: ${initialNormal}`);

    console.log('\n--- BƯỚC 2: TIẾN HÀNH MUA VÀ THANH TOÁN 1 VÉ NORMAL ---');
    // Mua 1 vé Normal
    const idemKey = `TEST_IDEM_${Date.now()}`;
    const orderResult = await paymentService.createOrder('user123', 1, [], { 'Normal': 1 }, 700000, idemKey);
    console.log(`=> Đã tạo Order: ${orderResult.orderId}`);
    
    // Chốt thanh toán
    console.log(`=> Đang chốt giao dịch thanh toán...`);
    await paymentService.captureOrder('user123', orderResult.orderId, idemKey, 1, [], { 'Normal': 1 }, 700000);
    console.log(`=> Giao dịch thành công! Đã trừ 1 vé trong Database PostgreSQL.`);

    console.log('\n--- BƯỚC 3: NGƯỜI DÙNG F5 TẢI LẠI TRANG ---');
    // Gọi lại API getShowInfo
    info = await infoService.getShowInfo(1);
    const finalNormal = info.zones.find((z: any) => z.zone === 'Normal').availableSlots;
    console.log(`=> Số vé Normal lấy được sau khi F5: ${finalNormal}`);

    console.log('\n=============================================');
    if (finalNormal === initialNormal - 1) {
      console.log('✅ KẾT QUẢ: KIỂM THỬ THÀNH CÔNG!');
      console.log(`Số vé đã được giảm ngay lập tức (Từ ${initialNormal} -> ${finalNormal}). Lỗi Stale Cache đã bị tiêu diệt hoàn toàn!`);
    } else {
      console.log('❌ KẾT QUẢ: KIỂM THỬ THẤT BẠI!');
      console.log(`Số vé vẫn bị kẹt ở mức ${finalNormal}. Lỗi Stale Cache vẫn còn tồn tại!`);
    }
    console.log('=============================================\n');

  } catch (error) {
    console.error('Lỗi khi chạy test:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
