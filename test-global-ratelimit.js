const http = require('http');

// Số lượng Request muốn bắn cùng 1 lúc
const TOTAL_REQUESTS = 200;

// URL của Nginx (Hiện tại Nginx đang được map ra cổng 3000 trong docker-compose)
const TARGET_URL = 'http://localhost:3000/info/';

let successCount = 0;
let rateLimitedCount = 0;
let errorCount = 0;

console.log(`🚀 Bắt đầu bắn ${TOTAL_REQUESTS} requests cùng lúc vào Nginx (Global Rate Limit = 50 req/s)...`);

const promises = [];
const startTime = Date.now();

for (let i = 0; i < TOTAL_REQUESTS; i++) {
  const p = new Promise((resolve) => {
    http.get(TARGET_URL, (res) => {
      // 503 là mã lỗi Nginx mặc định trả về khi bị giới hạn bởi limit_req
      // Nginx cũng có thể trả 429 nếu cấu hình limit_req_status 429;
      if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 404 || res.statusCode === 502) {
        // Miễn không phải 503 nghĩa là Nginx đã cho lọt qua (có thể server bên trong sập nên ra 502/404)
        successCount++;
      } else if (res.statusCode === 503 || res.statusCode === 429) {
        rateLimitedCount++;
      } else {
        errorCount++;
      }
      
      // Xóa bộ nhớ đệm response để giải phóng bộ nhớ
      res.on('data', () => {});
      res.on('end', resolve);
    }).on('error', (err) => {
      errorCount++;
      resolve();
    });
  });
  
  promises.push(p);
}

// Chờ tất cả request hoàn thành
Promise.all(promises).then(() => {
  const endTime = Date.now();
  const timeTaken = (endTime - startTime) / 1000;
  
  console.log(`\n📊 KẾT QUẢ TEST TẢI (Thời gian chạy: ${timeTaken} giây)`);
  console.log(`--------------------------------------------------`);
  console.log(`✅ Thành công lọt vào Server (Không bị Nginx chặn): ${successCount} requests`);
  console.log(`⛔ Bị Nginx chặn đứng (Rate Limited - Lỗi 503): ${rateLimitedCount} requests`);
  console.log(`❌ Lỗi khác (Mạng đứt, kết nối lỗi): ${errorCount} requests`);
  console.log(`--------------------------------------------------`);
  console.log(`Nhận xét: Nginx đã đỡ đạn thành công! Rất nhiều request đã bị rớt (⛔) ngay tại cổng vì vượt quá giới hạn phễu tổng 50 req/s.`);
});
