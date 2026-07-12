const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// HƯỚNG DẪN CÀI ĐẶT TRƯỚC KHI CHẠY:
// B1: Mở Terminal gõ: npm install -D playwright jsonwebtoken pg
// B2: Cài trình duyệt cho Playwright: npx playwright install chromium

// Tự động tạo Token hợp lệ (Lấy trực tiếp từ Database của bạn)
const JWT_SECRET = 'super-secret-key';
const TOKEN_USER_1 = jwt.sign({ sub: 'f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef', email: 'tung161020146@gmail.com', role: 'USER' }, JWT_SECRET);
const TOKEN_USER_2 = jwt.sign({ sub: '50511a78-31e2-45dc-924b-e61d2358b11e', email: 'admin@ticketbox.com', role: 'ORGANIZER' }, JWT_SECRET);
const EVENT_URL = 'http://localhost:5173/seat.html?id=1'; // Đổi URL sự kiện của bạn
const SEAT_TEXT = 'A-1';
const BOOK_BUTTON_SELECTOR = 'button:has-text("Tiếp tục")';

(async () => {
  console.log('🧹 Đang dọn dẹp Database (Reset ghế A-1 để test)...');
  const pgClient = new Client({ user: 'ticketbox', password: 'password', host: 'localhost', port: 5434, database: 'ticketbox_db' });
  await pgClient.connect();
  await pgClient.query(`UPDATE seat_inventory SET status = 'AVAILABLE', "reservedBy" = NULL, "expiryTime" = NULL WHERE "seatNo" = $1`, [SEAT_TEXT]);
  await pgClient.end();

  // Reset trong Redis
  const Redis = require('ioredis');
  const redis = new Redis({ host: 'localhost', port: 6379 });
  await redis.del('concert:1:svip_seats');
  await redis.del('booking:1:seats');
  await redis.quit();
  
  console.log('🚀 Đang khởi động 2 trình duyệt...');

  // Khởi tạo 2 cửa sổ trình duyệt (chia đôi màn hình)
  const browser1 = await chromium.launch({ headless: false, args: ['--window-position=0,0', '--window-size=960,1040'] });
  const browser2 = await chromium.launch({ headless: false, args: ['--window-position=960,0', '--window-size=960,1040'] });

  // Dùng 2 Context độc lập để không bị trùng Local Storage / Session
  const context1 = await browser1.newContext({ viewport: { width: 940, height: 960 } });
  const context2 = await browser2.newContext({ viewport: { width: 940, height: 960 } });

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  console.log('🔑 Đang đăng nhập 2 tài khoản...');
  // Inject token vào Local Storage để giả lập Login nhanh
  await page1.goto('http://localhost:5173');
  await page1.evaluate((token) => localStorage.setItem('token', token), TOKEN_USER_1);
  
  await page2.goto('http://localhost:5173');
  await page2.evaluate((token) => localStorage.setItem('token', token), TOKEN_USER_2);

  console.log('🔗 Đang mở trang chọn ghế...');
  // Điều hướng cả 2 vào trang sự kiện
  await Promise.all([
    page1.goto(EVENT_URL),
    page2.goto(EVENT_URL)
  ]);

  // Chờ cho màn hình load xong
  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);

  console.log('🎯 Đang chọn ghế ở 2 bên...');

  // Click chọn ghế
  await page1.getByText(SEAT_TEXT, { exact: true }).click();
  await page2.getByText(SEAT_TEXT, { exact: true }).click();

  // Chờ 2 giây để khán giả nhìn rõ cả 2 trình duyệt đều đã nhắm chung 1 ghế
  await page1.waitForTimeout(2000);

  console.log('💥 3... 2... 1... BẤM CHỐT GHẾ CÙNG LÚC!');

  // Bấm nút "Giữ vé" đồng thời bằng Promise.all
  await Promise.all([
    page1.click(BOOK_BUTTON_SELECTOR).catch(() => {}),
    page2.click(BOOK_BUTTON_SELECTOR).catch(() => {})
  ]);

  console.log('✅ Đã gửi request đồng thời! Hãy xem màn hình để thấy 1 bên văng lỗi, 1 bên thành công.');

  // Giữ màn hình mở thêm 10 giây để quay kết quả
  await page1.waitForTimeout(10000);

  await browser1.close();
  await browser2.close();
})();
