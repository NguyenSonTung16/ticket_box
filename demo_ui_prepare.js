const { chromium } = require('playwright');
const { Client } = require('pg');

const SEAT_TEXT = 'A-13';
const HOME_URL = 'http://localhost:5173/';
const EVENT_URL = 'http://localhost:5173/event.html?id=1';

(async () => {
  console.log('🧹 Đang dọn dẹp Database (Reset ghế A-13 để test)...');
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

  const browser1 = await chromium.launch({ headless: false, slowMo: 400, args: ['--window-position=0,0', '--window-size=960,1040'] });
  const browser2 = await chromium.launch({ headless: false, slowMo: 400, args: ['--window-position=960,0', '--window-size=960,1040'] });

  const context1 = await browser1.newContext({ viewport: { width: 940, height: 960 } });
  const context2 = await browser2.newContext({ viewport: { width: 940, height: 960 } });

  // Ghi đè hàm alert() mặc định bằng giao diện giống HỆT pop-up mặc định của Chrome
  const injectVisualAlert = `
    window.alert = function(msg) {
      // Backdrop để khóa màn hình
      const backdrop = document.createElement('div');
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100vw';
      backdrop.style.height = '100vh';
      backdrop.style.backgroundColor = 'transparent';
      backdrop.style.zIndex = '999998';
      document.body.appendChild(backdrop);

      // Hộp thoại Chrome Alert giả lập
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.top = '20px';
      div.style.left = '50%';
      div.style.transform = 'translateX(-50%)';
      div.style.backgroundColor = '#ffffff';
      div.style.color = '#202124';
      div.style.padding = '16px';
      div.style.borderRadius = '8px';
      div.style.zIndex = '999999';
      div.style.fontSize = '14px';
      div.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
      div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)';
      div.style.border = '1px solid #dadce0';
      div.style.width = '320px';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.gap = '20px';
      
      const hostText = document.createElement('div');
      hostText.innerText = window.location.host + " says";
      hostText.style.fontWeight = '500';
      hostText.style.fontSize = '13px';
      hostText.style.color = '#5f6368';

      const text = document.createElement('div');
      text.innerText = msg;
      text.style.whiteSpace = 'pre-line';
      text.style.lineHeight = '1.4';
      
      const content = document.createElement('div');
      content.appendChild(hostText);
      content.appendChild(text);
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.gap = '8px';

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.justifyContent = 'flex-end';
      
      const btn = document.createElement('button');
      btn.innerText = 'OK';
      btn.style.backgroundColor = '#1a73e8';
      btn.style.color = '#ffffff';
      btn.style.border = 'none';
      btn.style.padding = '8px 16px';
      btn.style.borderRadius = '4px';
      btn.style.fontSize = '14px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '500';
      
      btnContainer.appendChild(btn);
      div.appendChild(content);
      div.appendChild(btnContainer);
      document.body.appendChild(div);
      console.log('Custom Alert fired: ' + msg);
    };
  `;
  await context1.addInitScript(injectVisualAlert);
  await context2.addInitScript(injectVisualAlert);

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  console.log('🔗 Đang mở trang chủ...');
  await Promise.all([
    page1.goto(HOME_URL),
    page2.goto(HOME_URL)
  ]);

  console.log('📝 Đang chờ 1s rồi đăng ký 2 tài khoản mới...');
  
  const registerUser = async (page, index) => {
    await page.waitForTimeout(1000); // Mới vào chờ 1s
    await page.getByRole('button', { name: /đăng nhập/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByText('Đăng ký ngay').click();
    await page.fill('input[type="email"]', `testuser_${Date.now()}_${index}@gmail.com`);
    await page.fill('input[type="password"]', `password123`);
    await page.getByRole('button', { name: 'Tạo Tài Khoản' }).click();
    // Chờ cho request chạy xong và modal tự đóng
    await page.waitForTimeout(4000);
  };

  await Promise.all([
    registerUser(page1, 1),
    registerUser(page2, 2)
  ]);

  console.log('🎟️ Đang cuộn trang và ấn vào chung 1 concert...');
  const clickConcert = async (page) => {
    // Tìm card concert có chữ Anh Trai Say Hi, cuộn đến nó cho mượt
    const concertCard = page.locator('div.cursor-pointer').filter({ hasText: 'Anh Trai Say Hi' }).first();
    await concertCard.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await page.waitForTimeout(1500); // Khán giả nhìn quá trình cuộn
    await concertCard.click();
  };

  await Promise.all([
    clickConcert(page1),
    clickConcert(page2)
  ]);
  
  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);

  console.log('🛒 Ấn vào mua vé...');
  const clickBuyTicket = async (page) => {
    await page.getByText('Mua vé ngay').first().click();
  };

  await Promise.all([
    clickBuyTicket(page1),
    clickBuyTicket(page2)
  ]);

  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);

  console.log('🎯 Đang cuộn tìm ghế (A-13) ở cả 2 màn hình...');
  const scrollToSeat = async (page) => {
    const seatLocator = page.getByText(SEAT_TEXT, { exact: true });
    // Cuộn mượt mà để ghế nằm ngay chính giữa màn hình (cả chiều dọc và chiều ngang)
    await seatLocator.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }));
  };

  await Promise.all([
    scrollToSeat(page1),
    scrollToSeat(page2)
  ]);

  console.log('✅ Đã chuẩn bị xong sẵn sàng! Trình duyệt sẽ được giữ mở vĩnh viễn để bạn tự thao tác bằng tay.');
  console.log('🎮 Bạn có thể tự dùng chuột click vào ghế và ấn Tiếp Tục trên cả 2 màn hình để quay phim!');
  
  // Đợi vô tận để không tự động đóng trình duyệt
  await new Promise(() => {});
})();
