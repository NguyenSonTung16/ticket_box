const axios = require('axios');
const Redis = require('ioredis');

async function runDemo() {
  const redis = new Redis({ host: 'localhost', port: 6379 });

  console.log('🧹 Đang xóa Cache (để ép hệ thống phải gọi Database)...');
  await redis.del('show_info:1');

  const port = process.argv[2] || 3333;
  const url = `http://localhost:${port}/info/show/1`;

  const http = require('http');
  const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 1000 })
  });

  console.log(`🚀 Chuẩn bị bắn 100 requests CÙNG MỘT LÚC vào ${url}...`);
  
  // Tạo mảng chứa request promises
  const requests = [];
  const TOTAL_REQUESTS = 100;
  
  console.log('⏳ Đang chờ kết quả phản hồi...');
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    requests.push(
      axiosInstance.get(url)
        .then(res => res.status)
        .catch(err => {
          return typeof err.response?.data?.message === 'string' 
            ? err.response.data.message 
            : JSON.stringify(err.response?.data || err.message);
        })
    );
  }

  // Chờ toàn bộ 1000 request chạy xong
  const results = await Promise.all(requests);
  const endTime = Date.now();

  const successCount = results.filter(status => status === 200).length;

  console.log('\n======================================');
  console.log('🎯 KẾT QUẢ TEST SINGLEFLIGHT');
  console.log('======================================');
  console.log(`✅ Tổng số Request gửi đi: ${TOTAL_REQUESTS}`);
  console.log(`✅ Số Request thành công (HTTP 200): ${successCount}`);
  console.log(`⏱️ Tổng thời gian hoàn thành: ${(endTime - startTime) / 1000} giây`);
  if (successCount === 0 && results.length > 0) {
    console.log(`⚠️ Status code/lỗi của request đầu tiên: ${results[0]}`);
  }
  console.log('\n💡 HÃY NHÌN SANG MÀN HÌNH TERMINAL CỦA BACKEND (SERVER NESTJS)!');
  console.log('Bạn sẽ chỉ thấy DUY NHẤT 1 dòng log "DATABASE HIT" hiện ra, chứng tỏ 999 request còn lại đều đã được gộp chung vào 1 Promise đại diện thay vì làm sập DB!');
  
  await redis.quit();
}

runDemo();
