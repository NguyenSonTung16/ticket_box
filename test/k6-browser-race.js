import { browser } from 'k6/browser';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ui_race_condition: {
      executor: 'shared-iterations',
      vus: 2,           // Mở đúng 2 trình duyệt đồng thời
      iterations: 2,    // Chạy 2 lần (Mỗi VU 1 lần)
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};

export default async function () {
  // Tạo một tab trình duyệt mới cho mỗi VU
  const page = await browser.newPage();

  try {
    // 1. Mở trang chủ
    await page.goto('http://localhost:5173');

    // 2. Click nút Đăng nhập trên thanh điều hướng (Dùng XPath để tương thích tốt nhất với k6)
    await page.locator('//*[contains(text(), "Đăng nhập")]').click();

    // 3. Chuyển sang Đăng Ký và tạo tài khoản động (dùng Date.now để không bị trùng)
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const registerLink = spans.find(span => span.textContent && span.textContent.includes('Đăng ký ngay'));
      if (registerLink) registerLink.click();
    });
    await page.waitForTimeout(500);

    const randomEmail = `testuser_${__VU}_${Date.now()}@test.com`;
    await page.locator('input[type="email"]').type(randomEmail);
    await page.locator('input[type="password"]').type('password');
    
    // Bấm nút Tạo tài khoản
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const registerBtn = btns.find(btn => btn.textContent && btn.textContent.includes('Tạo Tài Khoản'));
      if (registerBtn) registerBtn.click();
    });

    // Chờ 1 giây để xử lý đăng nhập xong
    await page.waitForTimeout(1000);

    // 4. Chuyển thẳng tới trang chọn ghế của sự kiện số 1
    await page.goto('http://localhost:5173/seat.html?id=1');

    // Chờ giao diện map ghế render xong
    await page.waitForTimeout(2000);

    // 5. Tìm chính xác ghế SVIP có mã A-1 và click vào bằng Native Javascript (Đảm bảo 100% tìm thấy)
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      const seat = elements.find(el => el.textContent && el.textContent.trim() === 'A-1');
      if (seat) seat.click();
    });

    // 6. Bấm nút Thanh Toán bằng Native Javascript
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkout = btns.find(btn => btn.textContent && btn.textContent.includes('Thanh Toán'));
      if (checkout) checkout.click();
    });

    // Chờ hệ thống phản hồi
    await page.waitForTimeout(2000);

    // 7. Chụp screenshot để xem màn hình của 2 user sau khi tranh chấp
    await page.screenshot({ path: `screenshots/race_result_user_${__VU}.png` });

    // 8. Kiểm tra kết quả
    const content = await page.content();
    const isSuccess = content.includes('Thanh toán') || content.includes('Checkout');
    const isFailed = content.includes('người khác') || content.includes('đã có người đặt') || content.includes('hết');

    check(content, {
      'User mua thành công (Win)': isSuccess,
      'User mua thất bại (Lose)': isFailed,
    });

  } finally {
    // Đóng trang
    await page.close();
  }
}
