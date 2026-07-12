# TicketBox HA - Hướng Dẫn Cài Đặt & Khởi Chạy (Setup Guide)

TicketBox là hệ thống bán vé mô phỏng khả năng chịu tải cao (High Availability / Flash Sale). Hệ thống đã được tách thành kiến trúc Microservices chạy Cluster qua Nginx Load Balancer, kết hợp Hybrid Caching (Redis + Node Cache), Message Queue (RabbitMQ) và Server-Sent Events (SSE).

Dưới đây là hướng dẫn chi tiết từng bước để clone dự án về và chạy trên môi trường Local.

---

## 🛠 1. Yêu cầu hệ thống (Prerequisites)
Hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js** (Phiên bản >= 18.x)
2. **Docker** & **Docker Compose** (Dùng để chạy các Database/Services nền)
3. **Nginx** (Bắt buộc phải có để chạy Load Balancer cho Booking Service)
4. **Git**

---

## ⚙️ 2. Khởi động các Dịch vụ Nền (Infrastructure)
Hệ thống yêu cầu các nền tảng: PostgreSQL, Redis, RabbitMQ, MeiliSearch và MinIO. 
Tất cả đã được gói gọn trong file `docker-compose.yml`.

1. Mở Terminal tại thư mục gốc của dự án (`ticket_box/`).
2. Chạy lệnh sau để tải Image và chạy dưới nền:
```bash
docker-compose up -d
```
3. *(Lựa chọn)* Kiểm tra xem các container đã up chưa bằng lệnh `docker ps`.

---

## 📦 3. Cài đặt Thư viện & Cấu hình
Bạn cần cài đặt các gói NPM cho cả Backend và Frontend.

**Đối với Backend:**
1. Tại thư mục gốc, chạy lệnh:
```bash
npm install
```
2. Copy file `.env.example` thành `.env` (Nếu chưa có, hãy đảm bảo bạn có file `.env` chứa đủ các biến môi trường cho Postgres, Redis, MongoDB, MinIO...).

**Đối với Frontend:**
1. Di chuyển vào thư mục Frontend:
```bash
cd ticketbox-client
npm install
cd ..
```

---

## 🗄️ 4. Khởi tạo Database & Dữ liệu mẫu (Auto Setup)
Vì dự án sử dụng TypeORM và Mongoose, cấu trúc bảng (Schema) sẽ được tự động tạo khi chạy code. Bạn **không cần** chạy lệnh SQL tạo bảng.

**Cụ thể vị trí cấu trúc:**
- **Schema (PostgreSQL):** Hệ thống tự động quét các file `*.entity.ts` (VD: `src/booking/entities/zone-inventory.entity.ts`).
- **Schema (MongoDB):** Hệ thống tự động quét các file `*.schema.ts` (VD: `src/info/schemas/show-info.schema.ts`).
- **Seed Data (Dữ liệu mẫu):** Nằm gọn trong thư mục `src/database-setup/`.

Để tạo các dữ liệu mẫu ban đầu (Concerts, Zones, Tickets, Setup Minio bucket, Check-in...):
1. Đảm bảo Docker (Postgres, Redis...) đang chạy.
2. Từ thư mục gốc, chạy lệnh gộp setup:
```bash
npm run setup
```
*(Lệnh này sẽ chạy 3 file seed trong `src/database-setup/` để tạo Bucket trên MinIO, nạp hàng ngàn vé trống vào Database và Redis, cũng như đồng bộ Search Engine).*

---

## 🚀 5. Khởi động Cụm Backend (Microservices Cluster)
Dự án được phân chia thành nhiều Microservice. Bạn có 2 cách khởi động:

**Cách 1: Chạy toàn bộ Cluster (Nhanh nhất)**
Chạy script tự động mở tất cả 7 Node (Auth, Booking x3, Info, Payment, Worker) trong cùng 1 Terminal:
```bash
node start-cluster.js
```
*(Bạn sẽ thấy Terminal in ra log của tất cả các server, chạy trên các cổng 3001, 3002, 3012, 3022, 3003, 3004, 3005).*

**Cách 2: Chạy độc lập từng Service (Để debug hoặc phát triển)**
Bạn có thể mở từng Terminal riêng biệt và chạy từng lệnh NPM có sẵn:
- **Auth Service:** `npm run start:auth` (Cổng 3001)
- **Booking Service:** `npm run start:booking` (Cổng 3002)
- **Info Service:** `npm run start:info` (Cổng 3003)
- **Event Service:** `npm run start:event` (Cổng 3004)
- **Payment Service:** `npm run start:payment` (Cổng 3004)
- **Worker Service:** `npm run start:worker` (Cổng 3005)

*(Bạn chỉ cần bật những service liên quan đến module đang code).*

---

## ⚖️ 6. Khởi động Nginx Load Balancer (Quan trọng)
Frontend sẽ không gọi thẳng vào cổng 3002 mà gọi qua Nginx ở cổng **8080** để được phân tải đều (Round Robin / Least Conn) cho 3 Node Booking (3002, 3012, 3022).

1. Tìm file `nginx.conf` ở thư mục gốc dự án.
2. Thay thế file cấu hình của Nginx trên máy bạn (thường ở `C:\nginx\conf\nginx.conf` trên Windows hoặc `/etc/nginx/nginx.conf` trên Linux/Mac) bằng nội dung của file này.
3. Khởi động Nginx:
   - **Windows:** Chạy file `nginx.exe` hoặc lệnh `start nginx`
   - **Linux/Mac:** `sudo systemctl restart nginx` hoặc `sudo nginx -s reload`

---

## 🎨 7. Khởi động Frontend
Frontend sử dụng Vite.

1. Mở một Terminal mới, di chuyển vào thư mục Client:
```bash
cd ticketbox-client
```
2. Khởi động môi trường dev:
```bash
npm run dev
```
3. Truy cập vào đường dẫn do Vite cung cấp (thường là `http://localhost:5173`) để trải nghiệm hệ thống!

---

## 🌍 (Mở rộng) Cấu hình Ngrok để nhận Webhook thanh toán PayPal
Khi chạy Local, PayPal không thể gửi thông báo thanh toán thành công về máy bạn, dẫn đến vé không được chốt (Paid).
1. Cài đặt Ngrok. Chạy: `ngrok http 8080` (Cổng của Nginx).
2. Lấy link `https://<...>.ngrok-free.app`
3. Vào [PayPal Developer](https://developer.paypal.com/dashboard/applications), cài đặt Webhook URL thành: `https://<...>.ngrok-free.app/payment/webhook` (Chọn event *Payment capture completed*).
4. Sửa `PAYPAL_WEBHOOK_ID` trong file `.env` của dự án thành ID mới nhất PayPal cung cấp.
5. Khởi động lại Backend cluster.

Chúc bạn triển khai thành công hệ thống TicketBox! 🚀
