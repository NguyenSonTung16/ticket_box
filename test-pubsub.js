const http = require('http');
const Redis = require('ioredis');

const userId = 'test-user-' + Math.floor(Math.random() * 10000);
console.log('User ID:', userId);

let messageReceived = false;

// 1. Kết nối SSE trực tiếp vào Cổng 3002
const req = http.get(`http://localhost:3002/booking/sse/${userId}`, (res) => {
  console.log('[Cổng 3002] Đã cắm dây kết nối SSE thành công.');
  
  res.on('data', (chunk) => {
    const data = chunk.toString().trim();
    if (data) {
      console.log(`[Cổng 3002] Nhận được tin nhắn: ${data}`);
      if (data.includes('TEST_SUCCESS')) {
        messageReceived = true;
        console.log('✅ KIỂM THỬ THÀNH CÔNG: Cơ chế Pub/Sub hoạt động hoàn hảo! Đã nhận được tin nhắn chéo cổng.');
        process.exit(0);
      }
    }
  });
});

req.on('error', (err) => {
  console.error('[Cổng 3002] Không thể kết nối. Máy chủ đã được bật chưa?', err.message);
  process.exit(1);
});

// 2. Sau 2 giây, dùng Redis giả lập Máy 3012 phát thông báo lên Pub/Sub
setTimeout(async () => {
  console.log('\n[Cổng 3012] Đang giả lập xử lý xong và vứt tin nhắn lên Loa phát thanh Redis...');
  const redis = new Redis();
  
  const payload = JSON.stringify({
    targetClientId: userId,
    payload: { type: 'TEST_SUCCESS', message: 'Đây là tin nhắn giả lập từ máy 3012 gửi cho User cắm ở 3002' }
  });
  
  await redis.publish('ticketbox_sse_notify', payload);
  console.log('[Cổng 3012] Đã phát loa thành công! Chờ xem 3002 có bắt được không...\n');
  
  // Timeout nếu không nhận được
  setTimeout(() => {
    if (!messageReceived) {
      console.error('❌ KIỂM THỬ THẤT BẠI: Máy 3002 không bắt được tin nhắn. Hãy chắc chắn bạn đã KHỞI ĐỘNG LẠI cả 3 máy chủ sau khi tôi sửa code.');
      process.exit(1);
    }
  }, 2000);
}, 2000);
