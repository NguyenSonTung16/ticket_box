import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Mô phỏng 200 người dùng ảo (VUs) liên tục dội bom trong 10 giây
  vus: 200,
  duration: '10s',
};

export default function () {
  const res = http.get('http://localhost:3000/info/health'); // Bắn vào Nginx

  // Kiểm tra xem request lọt qua hay bị Nginx chặn
  check(res, {
    '✅ Lọt qua (Mã 200/502/404)': (r) => r.status !== 503 && r.status !== 429,
    '⛔ BỊ CHẶN (Rate Limited 503/429)': (r) => r.status === 503 || r.status === 429,
  });

  // Tạm nghỉ 100ms trước khi bắn tiếp
  sleep(0.1);
}
