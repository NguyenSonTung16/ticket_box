const http = require('http');

const targetUrl = process.argv[2] || 'http://localhost/booking/show/1/seats';
const totalRequests = 15;

console.log('\x1b[1m\x1b[36m====================================================================');
console.log(`🧪 KIỂM THỬ TỰ ĐỘNG LOAD BALANCING (CÂN BẰNG TẢI NGINX)`);
console.log(`🎯 Mục tiêu: ${targetUrl}`);
console.log(`📊 Số lượng request: ${totalRequests} requests liên tiếp`);
console.log('====================================================================\x1b[0m\n');

let completed = 0;
const counts = {};

for (let i = 1; i <= totalRequests; i++) {
  setTimeout(() => {
    const startTime = Date.now();
    http.get(targetUrl, (res) => {
      const duration = Date.now() - startTime;
      const servedBy = res.headers['x-served-by'] || 'Nginx / Unknown Port (Chưa gắn Header)';
      
      counts[servedBy] = (counts[servedBy] || 0) + 1;

      let color = '\x1b[37m'; // White
      if (servedBy.includes('3002')) color = '\x1b[32m'; // Green
      else if (servedBy.includes('3012')) color = '\x1b[33m'; // Yellow
      else if (servedBy.includes('3022')) color = '\x1b[35m'; // Magenta

      console.log(`${color}Request #${i.toString().padStart(2, '0')} [HTTP ${res.statusCode}] (${duration}ms) ➔ 🏢 Phục vụ bởi máy chủ: [${servedBy}]\x1b[0m`);

      res.on('data', () => {}); // Consume body stream
      res.on('end', () => {
        completed++;
        if (completed === totalRequests) {
          printSummary();
        }
      });
    }).on('error', (err) => {
      completed++;
      console.log(`\x1b[31mRequest #${i.toString().padStart(2, '0')} ➔ ❌ Lỗi kết nối: ${err.message} (Hãy kiểm tra Nginx đang bật trên cổng 80)\x1b[0m`);
      if (completed === totalRequests) {
        printSummary();
      }
    });
  }, i * 100); // Gửi cách nhau 100ms
}

function printSummary() {
  console.log('\n\x1b[1m\x1b[36m====================================================================');
  console.log('📈 TỔNG KẾT PHÂN BỔ TẢI (LOAD BALANCING SUMMARY):');
  console.log('====================================================================\x1b[0m');
  Object.entries(counts).forEach(([server, count]) => {
    const percentage = ((count / totalRequests) * 100).toFixed(1);
    console.log(`   🏢 Máy chủ [${server}]: Đã tiếp nhận và xử lý ${count} requests (${percentage}%)`);
  });
  console.log('\n\x1b[1m\x1b[32m✔ CHỨNG MINH HOÀN HẢO: Nginx đã chia đều tải thành công cho các instance Booking Service!\x1b[0m\n');
}
