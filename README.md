# TicketBox - Hệ Thống Bán Vé Tải Cực Hạn (Flash Sale)

TicketBox là một hệ thống mô phỏng nền tảng bán vé sự kiện âm nhạc, được thiết kế chuyên biệt để chịu tải cực hạn (Flash Sale) lên tới hàng chục nghìn người truy cập đồng thời mà không sập hệ thống hay sai lệch dữ liệu.

## 🏗 Kiến trúc Polyglot Persistence & Cốt lõi
Hệ thống kết hợp nhiều loại cơ sở dữ liệu và các công nghệ caching/messaging để đạt hiệu năng tối đa:
- **PostgreSQL**: Lưu trữ dữ liệu giao dịch cốt lõi (User, Invoice, Ticket, Import Jobs) đảm bảo tính nhất quán (ACID).
- **MongoDB**: Lưu trữ dữ liệu Document linh hoạt cho nội dung CMS (ShowInfo, Thiết lập sự kiện, Nội dung đa phương tiện).
- **MinIO**: Hệ thống Object Storage tương thích S3 lưu trữ các tài nguyên tĩnh (Hình ảnh cover, Logo) và xử lý file CSV khách mời VIP dung lượng lớn.
- **Redis (Cluster)**: Hỗ trợ Hybrid Caching 2 tầng (Local RAM + Redis) và Pub/Sub. Cơ chế khóa nguyên tử `HSETNX` giải quyết tranh chấp ghế (Zero Seat Clash).
- **RabbitMQ**: Đóng vai trò Message Broker xử lý hàng đợi (Worker Queue), đảm bảo tính toàn vẹn khi nhả vé do quá hạn thanh toán và thực thi các tác vụ nền.
- **Server-Sent Events (SSE)**: Đẩy trạng thái sơ đồ chỗ ngồi xuống Client theo thời gian thực (Real-time).

---

## 📌 Yêu cầu hệ thống (Prerequisites)
Trước khi cài đặt, bạn cần đảm bảo môi trường đã có sẵn:
1. **Node.js** (Phiên bản >= 18.x) - [Tải về Node.js](https://nodejs.org/)
2. **Docker Desktop** (Bắt buộc để chạy cơ sở hạ tầng DB, Redis, v.v.) - [Tải về Docker Desktop](https://www.docker.com/products/docker-desktop/)
3. **Git** - [Tải về Git](https://git-scm.com/)

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy từ đầu (Zero-to-Hero Setup)

Nếu bạn vừa clone một thư mục code mới tinh về máy, đây là quy trình chuẩn xác nhất để chạy hệ thống mà không gặp bất kỳ lỗi nào.

### Bước 1: Khởi động Cơ sở hạ tầng & Tự động khôi phục Dữ liệu
Mở terminal tại thư mục gốc của dự án (`ticket_box_add_pay/`) và chạy:
```bash
docker-compose up -d
```
*Ghi chú quan trọng:* Lệnh này không chỉ tải và chạy PostgreSQL, MongoDB, Redis, RabbitMQ, v.v. mà nó còn **tự động nạp toàn bộ cấu trúc bảng (schema) và dữ liệu mẫu (seed data)** từ thư mục `data/` vào PostgreSQL. Bạn không cần phải chạy thêm bất kỳ lệnh SQL nào!

### Bước 2: Thiết lập biến môi trường (.env)
Bởi vì file `.env` chứa các API Key nhạy cảm nên nó đã bị ẩn khỏi thư mục Git. Bạn cần tự tạo nó:
- Copy file `.env.example` và đổi tên thành `.env` (nằm ở thư mục gốc).
- *(Tùy chọn)* Nếu bạn muốn test tính năng Thanh toán thật hoặc AI sinh nội dung, hãy điền các Key của bạn (PayPal, Gemini) vào file `.env` vừa tạo. Các thông số cơ bản như Database, Redis, MinIO đã được thiết lập sẵn, không cần sửa!

### Bước 3: Cài đặt thư viện (Dependencies) cho toàn dự án
Để cài đặt `node_modules` cho cả Backend (NestJS) và 2 Frontends (Client & Organizer viết bằng React/Vite), bạn chỉ cần chạy 1 lệnh duy nhất:
```bash
npm run install:all
```

### Bước 4: Khởi chạy TOÀN BỘ Hệ thống (Backend & Frontends)
Bạn không cần phải mở nhiều terminal phức tạp. Để khởi động đồng thời tất cả 8 Microservices của Backend và 2 ứng dụng Frontend, sử dụng lệnh:
```bash
npm run start:all
```
Hệ thống sẽ chạy ngầm và tự động khởi động toàn bộ các services. Hãy chờ khoảng 10-15 giây để các service hoàn tất quá trình boot.

---

## 🔗 Danh sách Địa chỉ Truy cập (Service URLs)

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
- Nginx Proxy: `http://localhost:3000`

---

## 📧 Cấu hình Ngrok để nhận Webhook Thanh toán & Gửi Email

Vì hệ thống chạy ở Localhost, để PayPal có thể gọi Webhook khi thanh toán thành công và tự động gửi vé qua Email, bạn cần cài đặt và cấu hình `ngrok`:

**Cài đặt Ngrok:**
1. Truy cập [ngrok.com/download](https://ngrok.com/download) để tải và cài đặt Ngrok cho hệ điều hành của bạn.
2. Đăng ký tài khoản miễn phí và làm theo hướng dẫn trên trang chủ để liên kết Authtoken (chạy lệnh `ngrok config add-authtoken <token_của_bạn>`).

**Cấu hình Webhook PayPal:**
1. Mở một terminal mới và chạy ngrok trỏ vào port của dịch vụ Payment: `ngrok http 3004`.
2. Copy đường dẫn HTTPS Forwarding do ngrok tạo ra (ví dụ: `https://abcd.ngrok-free.app`).
3. Đăng nhập vào [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications), chọn App của bạn, nhấn **Add Webhook** với URL vừa copy cộng thêm route API (ví dụ: `https://abcd.ngrok-free.app/api/v1/payment/webhook/paypal`). Nhớ tick chọn sự kiện `PAYMENT.CAPTURE.COMPLETED`.
4. Sau khi lưu, copy mã **Webhook ID** do PayPal cung cấp và điền vào biến `PAYPAL_WEBHOOK_ID` trong file `.env` ở thư mục gốc.
5. Khởi động lại hệ thống để nhận file cấu hình `.env` mới nhất.
