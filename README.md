# TicketBox - Hệ Thống Bán Vé Tải Cực Hạn (Flash Sale)

TicketBox là một hệ thống mô phỏng nền tảng bán vé sự kiện âm nhạc, được thiết kế chuyên biệt để chịu tải cực hạn (Flash Sale) lên tới hàng chục nghìn người truy cập đồng thời mà không sập hệ thống hay sai lệch dữ liệu.

## 🚀 Kiến trúc Polyglot Persistence & Cốt lõi
Hệ thống kết hợp nhiều loại cơ sở dữ liệu và các công nghệ caching/messaging để đạt hiệu năng tối đa:
- **PostgreSQL**: Lưu trữ dữ liệu giao dịch cốt lõi (User, Invoice, Ticket, Import Jobs) đảm bảo tính nhất quán (ACID).
- **MongoDB**: Lưu trữ dữ liệu Document linh hoạt cho nội dung CMS (ShowInfo, Thiết lập sự kiện, Nội dung đa phương tiện).
- **MinIO**: Hệ thống Object Storage tương thích S3 lưu trữ các tài nguyên tĩnh (Hình ảnh cover, Logo) và xử lý file CSV khách mời VIP dung lượng lớn.
- **Redis (Cluster)**: Hỗ trợ Hybrid Caching 2 tầng (Local RAM + Redis) và Pub/Sub. Cơ chế khóa nguyên tử `HSETNX` giải quyết tranh chấp ghế (Zero Seat Clash).
- **RabbitMQ**: Đóng vai trò Message Broker xử lý hàng đợi (Worker Queue), đảm bảo tính toàn vẹn khi nhả vé do quá hạn thanh toán và thực thi các tác vụ nền.
- **Server-Sent Events (SSE)**: Đẩy trạng thái sơ đồ chỗ ngồi xuống Client theo thời gian thực (Real-time).

---

## 🛠 Yêu cầu hệ thống (Prerequisites)
Trước khi cài đặt, bạn cần đảm bảo môi trường đã có sẵn:
1. **Node.js** (Phiên bản >= 18.x)
2. **Docker** & **Docker Compose** (Bắt buộc để chạy cơ sở hạ tầng DB, Redis, v.v.)
3. **Git**

---

## ⚙️ Hướng dẫn Cài đặt & Khởi chạy Nhanh (Quick Start)

Việc chạy hệ thống rất đơn giản nhờ các script đã được thiết lập sẵn trong `package.json`. Vui lòng thực hiện theo đúng thứ tự sau:

### Bước 1: Khởi động Cơ sở hạ tầng (Databases, Caches, Brokers)
Mở terminal tại thư mục gốc của dự án (`ticket_box/`) và chạy:
```bash
docker-compose up -d
```
*Ghi chú: Lệnh này sẽ tải image và khởi động PostgreSQL, MongoDB, MinIO, Redis, RabbitMQ và MeiliSearch dưới nền.*

### Bước 2: Cài đặt Dependencies cho toàn bộ dự án
Để cài đặt `node_modules` cho cả Backend và 2 Frontends (Client & Organizer), bạn chỉ cần chạy:
```bash
npm run install:all
```

### Bước 3: Khởi tạo Dữ liệu mẫu (Seed Data)
Để có sẵn dữ liệu sự kiện và Organizer test, chạy lệnh sau để import dữ liệu mẫu vào PostgreSQL:
```bash
npm run seed:db
```
*Ngoài ra, hệ thống tự động nạp (sync) các thay đổi database thông qua TypeORM khi khởi động Backend.*

### Bước 4: Khởi chạy TOÀN BỘ Hệ thống (Backend & Frontends)
Bạn không cần phải mở nhiều terminal. Để chạy đồng thời 8 Microservices của Backend và 2 ứng dụng Frontend, sử dụng lệnh:
```bash
npm run start:all
```
Hệ thống sẽ chạy nền tự động.

---

## 🌍 Danh sách Địa chỉ Truy cập (Service URLs)

Sau khi hệ thống khởi chạy thành công, bạn có thể truy cập qua các địa chỉ sau:

### Giao diện Người dùng (Frontends)
- **TicketBox Khán Giả (Client):** `http://localhost:5173`
- **TicketBox Ban Tổ Chức (Organizer Center):** `http://localhost:5174`

### Các Công cụ Quản trị (Infrastructure Dashboards)
- **MinIO Console (Quản lý File & S3):** `http://localhost:9001`
  - *Đăng nhập:* `ticketbox_admin` / `ticketbox_secret_2026`
- **RabbitMQ Management:** `http://localhost:15672`
  - *Đăng nhập:* `guest` / `guest`

### Backend Microservices (Cổng API nội bộ)
- Auth Service: `http://localhost:3001`
- Booking Service: `http://localhost:3002`
- Info Service: `http://localhost:3003`
- Payment Service: `http://localhost:3004`
- Event Service: `http://localhost:3005`
- Worker Service: `http://localhost:3006`
- Checkin Service: `http://localhost:3007`
- AI Service: `http://localhost:3008`
- (Có thể có Nginx Proxy ở port `3000` tùy cấu hình)

---

## 💸 Cấu hình Ngrok để nhận Webhook Thanh toán & Gửi Email

Vì hệ thống chạy ở Localhost, để PayPal có thể gọi Webhook khi thanh toán thành công và tự động gửi vé qua Email, bạn cần:
1. Chạy ngrok cho port của dịch vụ Payment: `ngrok http 3004` (hoặc port proxy chung).
2. Lấy URL (ví dụ: `https://abcd.ngrok-free.app`) và cấu hình Webhook trong [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications).
3. Đặt Webhook ID PayPal trả về vào biến `PAYPAL_WEBHOOK_ID` trong file `.env` ở thư mục gốc.
4. Khởi động lại hệ thống.
