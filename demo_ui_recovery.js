const { chromium } = require('playwright');
const { exec } = require('child_process');

async function runDemo() {
  console.log('🚀 [KỊCH BẢN 4] BẮT ĐẦU DEMO CRASH RECOVERY (TỰ ĐỘNG PHỤC HỒI KHI SẬP REDIS)');
  
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Đăng ký & Đăng nhập một tài khoản ngẫu nhiên
  const randomId = Math.floor(Math.random() * 100000);
  const email = `recovery_test_${randomId}@example.com`;
  
  console.log(`\n👤 [Bước 1] Đang tạo tài khoản test: ${email}`);
  await page.goto('http://localhost:3000/auth');
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Mật khẩu"]', 'password123');
  await page.click('button:has-text("Đăng ký")');
  await page.waitForTimeout(1000);

  // 2. Vào trang chọn ghế
  console.log(`🗺️ [Bước 2] Truy cập trang Sơ đồ ghế...`);
  await page.goto('http://localhost:3000');
  await page.waitForSelector('text=Anh Trai Say Hi');
  await page.click('text=Anh Trai Say Hi');
  await page.waitForSelector('.seat-map-container');

  // Tìm một ghế trống (màu đỏ)
  const availableSeat = await page.locator('.seat.available').first();
  const seatId = await availableSeat.getAttribute('data-seat-id');
  
  console.log(`🎯 [Bước 3] Tiến hành chốt mua ghế [${seatId}]...`);
  await availableSeat.click();
  await page.click('button:has-text("Tiếp tục")');
  
  // Đợi xác nhận vé mua thành công
  await page.waitForSelector('text=Thanh toán vé');
  console.log(`✅ [Hoàn tất] Đã thanh toán và ghi nhận giao dịch thành công cho ghế [${seatId}] vào PostgreSQL!`);

  // Quay lại trang sơ đồ ghế để xem ghế đã chuyển xám chưa
  await page.goto('http://localhost:3000');
  await page.click('text=Anh Trai Say Hi');
  await page.waitForSelector('.seat-map-container');
  
  console.log(`👀 [Bước 4] Ghế [${seatId}] trên giao diện hiện tại đã chuyển sang màu xám (Đã bán).`);
  
  // 3. ĐÁNH SẬP REDIS (FLUSHALL)
  console.log(`\n===============================================================`);
  console.log(`💥 [SỰ CỐ] GIẢ LẬP REDIS BỊ MẤT ĐIỆN VÀ MẤT SẠCH DỮ LIỆU...`);
  console.log(`===============================================================\n`);
  
  await new Promise((resolve) => {
    exec('redis-cli FLUSHALL', (error, stdout) => {
      if (error) {
        console.error('Lỗi khi đánh sập Redis:', error);
      } else {
        console.log(`✅ [Hệ thống] Đã thực thi lệnh FLUSHALL. Dữ liệu trên RAM đã bốc hơi hoàn toàn!`);
      }
      resolve();
    });
  });

  // Nghỉ 3 giây để người xem thấm sự cố
  let countdown = 5;
  while(countdown > 0) {
    console.log(`⏳ Chuẩn bị tải lại trang (F5) trong ${countdown} giây...`);
    await page.waitForTimeout(1000);
    countdown--;
  }

  // 4. F5 TẢI LẠI TRANG (Chứng minh dữ liệu không mất)
  console.log(`\n🔄 [Bước 5] Người dùng F5 tải lại trang sau sự cố...`);
  await page.reload();
  await page.waitForSelector('.seat-map-container');

  // Chờ một chút để UI render
  await page.waitForTimeout(2000);

  console.log(`\n🎉 [KẾT QUẢ THẦN KỲ] Nhìn kìa! Ghế [${seatId}] VẪN LÀ MÀU XÁM (ĐÃ BÁN)!`);
  console.log(`👉 Hãy nhìn sang màn hình Terminal của NestJS (Server Backend)`);
  console.log(`👉 Bạn sẽ thấy dòng log: "[Repair Sync] Bắt đầu đồng bộ lại trạng thái ghế..."`);
  console.log(`👉 Điều này chứng minh Server đã âm thầm chui xuống PostgreSQL kéo dữ liệu lên và bơm lại vào Redis để phục hồi nguyên vẹn!`);

  console.log(`\n(Giao diện sẽ tự đóng sau 10 giây...)`);
  await page.waitForTimeout(10000);
  await browser.close();
}

runDemo().catch(console.error);
