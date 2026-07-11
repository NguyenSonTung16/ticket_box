# TÀI LIỆU TÍCH HỢP HỆ THỐNG & HƯỚNG DẪN SỬ DỤNG
*(Authentication, Check-in System & AI Artist Bio Pipeline)*

Tài liệu này hướng dẫn chi tiết về các thay đổi mã nguồn sau khi di chuyển và tích hợp toàn bộ các tính năng nghiệp vụ từ **Repository (1) (TicketBox-Backend)** sang **Repository (2) (ticket_box)**. 

Hệ thống hiện tại đã hoạt động như một Monolith phân rã (Modular Monolith) hoặc các Microservices riêng biệt, tùy chỉnh linh hoạt thông qua biến môi trường.

---

## 1. TỔNG QUAN CÁC THAY ĐỔI TRONG MÃ NGUỒN

Các tính năng mới được tích hợp vào Repository (2) theo cấu trúc thư mục chuẩn của NestJS (`TypeORM` cho PostgreSQL và `Mongoose` cho MongoDB):

### A. Authentication & Security
*   **[NEW]** `src/auth/decorators/`
    *   `roles.decorator.ts`: Đánh dấu phân quyền Role cho endpoint.
    *   `permissions.decorator.ts`: Đánh dấu phân quyền Permission cho endpoint.
*   **[NEW]** `src/auth/guards/`
    *   `roles.guard.ts`: Bảo vệ API dựa trên Role của người dùng.
    *   `permissions.guard.ts`: Ánh xạ động Role (`USER`, `ORGANIZER`, `ADMIN`) sang danh sách Permission nghiệp vụ bằng bảng tra cứu (Static RBAC Lookup).
*   **[MODIFY]** `src/auth/entities/user.entity.ts`: Thêm trường `status` (`ACTIVE` | `LOCKED`) hỗ trợ khóa tài khoản.
*   **[MODIFY]** `src/auth/jwt.strategy.ts`:
    *   Trích xuất thêm các trường `role` và `permissions` từ JWT Payload.
    *   Tự động kiểm tra Token có nằm trong Danh sách đen (Blacklist) của Redis hay không trên mỗi request.
*   **[MODIFY]** `src/auth/auth.service.ts`:
    *   **Failed Login Lockout**: Lưu số lần đăng nhập sai vào Redis. Nếu sai liên tiếp 5 lần $\rightarrow$ Khóa IP+Email trong 15 phút. Nếu sai liên tiếp 10 lần $\rightarrow$ Đổi trạng thái `status` của tài khoản thành `LOCKED` vĩnh viễn trên Database.
    *   **Token JTI & Logout**: Tạo thêm một định danh duy nhất `jti` khi ký Access Token. Khi người dùng gọi `/auth/logout`, token `jti` sẽ bị đẩy vào Redis Blacklist trong 15 phút.
*   **[MODIFY]** `src/auth/auth.controller.ts`: Cập nhật endpoint `/auth/login` để lấy Client IP và thêm API `/auth/logout` (yêu cầu JWT token).

### B. Check-in System (Hệ thống Kiểm soát Vé tại Cổng)
*   **[NEW]** `src/checkin/entities/`
    *   `gate-device.entity.ts`: Quản lý các thiết bị/máy quét vé ở các cổng.
    *   `checkin.entity.ts`: Ghi nhận dữ liệu quét vé (thời gian, thiết bị, trạng thái đồng bộ).
    *   `offline-sync-log.entity.ts`: Nhật ký đồng bộ các lô vé quét offline từ thiết bị.
*   **[MODIFY]** `src/booking/entities/ticket.entity.ts`: Thêm trường `status` (`valid`, `checked_in`, `refunded`, `invalid`) để lưu vết trạng thái vé.
*   **[NEW]** `src/checkin/dto/checkin.dto.ts`: Định nghĩa dữ liệu đầu vào cho cổng API check-in online và đồng bộ offline.
*   **[NEW]** `src/checkin/checkin.service.ts`:
    *   **Xác thực Chữ ký số**: Kiểm tra tính toàn vẹn của mã QR bằng chữ ký số Ed25519 được ký từ hệ thống phát hành vé.
    *   **Quản lý Khóa phân tán (Redis Lock)**: Ngăn chặn lỗi Race Condition (quét 1 vé tại 2 cổng cùng 1 lúc).
    *   **Đồng bộ Offline (First-Write-Wins)**: Xử lý xung đột khi đồng bộ. Nếu vé đã được quét online hoặc quét ở máy khác: so sánh thời gian quét offline (`scannedAt`). Máy nào quét trước sẽ được ghi nhận là `SUCCESS`, lượt quét sau sẽ đổi thành `DUPLICATE` hoặc `CONFLICT` và bắn cảnh báo về RabbitMQ.
*   **[NEW]** `src/checkin/checkin.controller.ts`: API Endpoint cho kiểm soát vé.
*   **[NEW]** `src/checkin/checkin.module.ts`: Đóng gói và đăng ký module kiểm soát vé.

### C. AI Artist Bio Pipeline (Tự động Tóm tắt thông tin Nghệ sĩ)
*   **[NEW]** `src/ai/entities/`
    *   `artist-document.entity.ts`: Quản lý các file tài liệu PDF thông tin nghệ sĩ tải lên bởi Organizer.
    *   `ai-job.entity.ts`: Theo dõi tiến trình phân tích thông tin của AI (`PENDING` | `EXTRACTING` | `SUMMARIZING` | `COMPLETED` | `FAILED`).
    *   `prompt-template.entity.ts`: Quản lý prompt hệ thống gửi cho AI.
    *   `artist-bio.entity.ts`: Chứa kết quả tóm tắt gồm 3 phiên bản: Ngắn (Short), Vừa (Medium) và Chuẩn SEO (SEO Bio).
*   **[MODIFY]** `src/minio/minio.service.ts`: Bổ sung 2 helper `uploadBuffer()` và `downloadBuffer()` để thao tác trực tiếp với dữ liệu dạng Stream.
*   **[NEW]** `src/ai/ai.service.ts`: Xử lý upload file lên MinIO, tạo Job và đẩy Event vào hàng đợi RabbitMQ.
*   **[NEW]** `src/ai/ai.controller.ts`: API tải lên file PDF nghệ sĩ, kiểm tra trạng thái Job AI và Phê duyệt Bio.
*   **[NEW]** `src/ai/ai.worker.ts`: Hàng đợi ngầm (Queue Consumer) nhận tác vụ:
    1. Tải PDF từ MinIO.
    2. Trích xuất văn bản từ PDF (sử dụng thư viện `pdf-parse`).
    3. Gọi API Google Gemini (model `gemini-2.5-flash`) để tóm tắt theo Prompt Template.
    4. Nếu API Key trống, tự động chuyển sang dữ liệu giả lập (Structured Mock AI Fallback).
    5. Xử lý lỗi tự động thử lại (Exponential Backoff Retry tối đa 3 lần), sau đó chuyển vào hàng đợi lỗi (DLQ - Dead Letter Queue).
*   **[NEW]** `src/ai/ai.module.ts`: Đăng ký module AI.

### D. Core Integration & App Module
*   **[MODIFY]** `src/info/schemas/show-info.schema.ts`: Khai báo thêm trường `artistBio` trong MongoDB để hiển thị ở trang chi tiết Concert.
*   **[MODIFY]** `src/event/event.service.ts`: Cập nhật API `getEventDetail` để gộp và trả ra thông tin `artistBio` từ MongoDB.
*   **[MODIFY]** `src/app.module.ts`: Đăng ký thêm `CheckinModule`, `AiModule` và `WorkerModule`.

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)

Vui lòng bổ sung hoặc cập nhật các biến sau trong file `.env` ở thư mục gốc của dự án:

```env
# --- CẤU HÌNH KHÓA CHỮ KÝ SỐ ED25519 (Dành cho Check-in) ---
# Nếu trống, hệ thống sẽ sử dụng khóa mặc định chạy local
ED25519_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAtpQjNk5cS5jF9MmvAG21SE8QhHzjxkKLUTzPEYRAUwY=\n-----END PUBLIC KEY-----"

# --- CẤU HÌNH GEMINI AI (Dành cho AI Bio Worker) ---
# Nếu không cung cấp API Key, Worker sẽ chạy ở chế độ Mock Fallback (không lỗi hệ thống)
GEMINI_API_KEY="your-google-gemini-api-key-here"

# --- CẤU HÌNH MINIO OBJECT STORAGE (Dành cho tài liệu nghệ sĩ) ---
MINIO_ENDPOINT="http://localhost:9000"
MINIO_PUBLIC_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minio_admin"
MINIO_SECRET_KEY="minio_password"
```

---

## 3. HƯỚNG DẪN CHẠY HỆ THỐNG (RUN GUIDE)

Hệ thống hỗ trợ chạy ở cả hai chế độ tùy theo kiến trúc vận hành của đội ngũ dev/ops:

### Cách 1: Chạy toàn bộ hệ thống (Monolithic Mode - Khuyên dùng khi dev local)
Chạy toàn bộ các Module (Auth, Booking, Info, Event, Payment, Checkin, AI Bio, Background Worker) chung trong một tiến trình server duy nhất:
```bash
# 1. Khởi động các cơ sở dữ liệu và hàng đợi (Postgres, MongoDB, Redis, RabbitMQ, MinIO)
docker-compose up -d

# 2. Khởi chạy Monolith Server
npm run start
```

### Cách 2: Chạy dưới dạng các dịch vụ riêng lẻ (Microservices Mode)
Thông qua biến môi trường `SERVICE_NAME`, NestJS sẽ tự động cô lập bộ nhớ và chỉ khởi động Module được chỉ định:

*   **Dịch vụ Authentication**:
    ```bash
    cross-env PORT=3001 SERVICE_NAME=auth ts-node src/main.ts
    ```
*   **Dịch vụ Check-in API**:
    ```bash
    cross-env PORT=3008 SERVICE_NAME=checkin ts-node src/main.ts
    ```
*   **Dịch vụ AI Bio API**:
    ```bash
    cross-env PORT=3009 SERVICE_NAME=ai ts-node src/main.ts
    ```
*   **Dịch vụ Background Worker (Consumes AI & Guest Import queues)**:
    ```bash
    cross-env SERVICE_NAME=worker ts-node src/main.ts
    ```

---

## 4. HƯỚNG DẪN KIỂM THỬ (TEST GUIDE)

Chúng tôi cung cấp bộ gỡ lỗi và kiểm thử đơn vị cho hệ thống cache SingleFlight:
```bash
npx jest tests/info.service.spec.ts
```
**Kết quả mong đợi:** 
```text
PASS tests/info.service.spec.ts
  InfoService - getShowInfo SingleFlight Test
    ✓ should only query DB once for 1000 concurrent requests when Cache Misses (SingleFlight pattern)
```

---

## 5. HƯỚNG DẪN SỬ DỤNG CHI TIẾT CÁC ENDPOINT API

Dưới đây là tài liệu đặc tả các API chính mới được đưa vào hệ thống:

### A. NHÓM API AUTHENTICATION & SECURITY
Mọi API bên dưới ngoại trừ `/auth/login` đều yêu cầu header: `Authorization: Bearer <Access_Token>`.

#### 1. Đăng xuất tài khoản (Logout & Revoke Token)
*   **URL:** `/api/auth/logout`
*   **Method:** `POST`
*   **Mô tả:** Đẩy token JTI hiện tại vào danh sách đen của Redis nhằm vô hiệu hóa token ngay lập tức (kể cả khi chưa hết hạn).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

---

### B. NHÓM API CHECK-IN (KIỂM SOÁT VÉ CỔNG)
Yêu cầu quyền truy cập: Người dùng phải có phân quyền `CHECKIN_SCAN` (thuộc vai trò `ADMIN` hoặc `ORGANIZER`).

#### 1. Quét vé Online (Real-time Scan)
*   **URL:** `/api/checkin/verify`
*   **Method:** `POST`
*   **Headers:** 
    *   `x-device-code: gate-A-scanner-01` (Mã định danh máy quét, tự động tạo mới máy quét trong DB nếu chưa tồn tại).
*   **Body (JSON):**
    ```json
    {
      "ticketId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "concertId": "123",
      "seatInfo": "SVIP-A-12",
      "issuedAt": 1717848000,
      "signature": "z8Y9X7W6V5U4..."
    }
    ```
*   **Mô tả:** Kiểm tra chữ ký số Ed25519 của vé. Nếu hợp lệ, kiểm tra xem vé đã được dùng hay chưa trên Database. Nếu chưa quét, ghi nhận thành công và đẩy sự kiện checkin thành công lên RabbitMQ.
*   **Response (200 OK):**
    ```json
    {
      "status": "SUCCESS",
      "message": "Check-in successful",
      "ticketId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "scannedAt": "2026-07-11T04:20:00Z"
    }
    ```

#### 2. Đồng bộ Vé quét ngoại tuyến (Offline Check-in Sync)
Khi mất kết nối mạng, máy quét local sẽ tự lưu vết quét vào bộ nhớ tạm. Khi có mạng trở lại, nó gửi toàn bộ lịch sử quét về server để đồng bộ.
*   **URL:** `/api/checkin/sync`
*   **Method:** `POST`
*   **Body (JSON):**
    ```json
    {
      "deviceId": "gate-A-scanner-01",
      "batchId": "batch-1717859000-002",
      "checkins": [
        {
          "ticketId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "concertId": "123",
          "seatInfo": "SVIP-A-12",
          "scannedAt": "2026-06-08T17:10:00Z",
          "issuedAt": 1717848000,
          "signature": "z8Y9X7W6..."
        }
      ]
    }
    ```
*   **Mô tả:** Thực hiện thuật toán **First-Write-Wins**. 
    *   Nếu vé chưa từng được quét: Đồng bộ trạng thái vé thành `checked_in`, trả về `SUCCESS`.
    *   Nếu vé đã quét: So sánh thời điểm quét của bản ghi offline (`scannedAt`) với thời điểm quét hiện tại trên DB. Nếu bản ghi offline quét trước $\rightarrow$ Cập nhật bản ghi cũ thành `DUPLICATE`, ghi nhận bản ghi offline quét trước này là `SUCCESS` mới và bắn thông báo cảnh báo xung đột về hệ thống.
*   **Response (200 OK):**
    ```json
    {
      "batchId": "batch-1717859000-002",
      "processedCount": 1,
      "successCount": 1,
      "conflicts": []
    }
    ```

#### 3. Xem lịch sử quét vé theo Concert
*   **URL:** `/api/checkin/history?concertId=123&page=1&limit=50`
*   **Method:** `GET`
*   **Mô tả:** Xem danh sách vé đã quét tại cổng (Hỗ trợ phân trang và lọc theo ID máy quét `deviceId`).

---

### C. NHÓM API AI ARTIST BIO (TỰ ĐỘNG TẠO TIỂU SỬ NGHỆ SĨ)
Yêu cầu quyền truy cập: Người dùng có vai trò `ORGANIZER` hoặc `ADMIN` (phân quyền `AI_BIO_UPLOAD`).

#### 1. Upload tài liệu nghệ sĩ (PDF) & Chạy Pipeline tự động
*   **URL:** `/api/artist/upload`
*   **Method:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body (Form-Data):**
    *   `file`: (Tập tin PDF tiểu sử nghệ sĩ)
    *   `concertId`: `123`
*   **Mô tả:** Upload file lên hệ thống lưu trữ đối tượng MinIO. Tạo một Job trạng thái `PENDING` và gửi message kích hoạt Worker phân tích ngầm.
*   **Response (201 Created):**
    ```json
    {
      "jobId": "a2bc3d4e-5f6g-7h8i-9j0k-1l2m3n4o5p6q",
      "documentId": "e3e8f7a8-1212-4c7b-8b5e-ea784cf8db92",
      "status": "PENDING",
      "message": "File uploaded successfully. AI processing initiated."
    }
    ```

#### 2. Kiểm tra trạng thái Job hoặc thông tin Tiểu sử nghệ sĩ
*   **URL:** `/api/artist/bio/:id` (Với `:id` có thể là `jobId`, `documentId`, hoặc `concertId`)
*   **Method:** `GET`
*   **Response khi AI đang xử lý (Job state):**
    ```json
    {
      "id": "a2bc3d4e-5f6g-7h8i-9j0k-1l2m3n4o5p6q",
      "status": "PARSING"
    }
    ```
*   **Response khi AI đã tạo xong và đang chờ kiểm duyệt (Pending Review):**
    ```json
    {
      "id": "e3e8f7a8-1212-4c7b-8b5e-ea784cf8db92",
      "concertId": 123,
      "shortBio": "Ngắn: Nghệ sĩ tài năng hàng đầu Việt Nam...",
      "mediumBio": "Trung bình: Nghệ sĩ phát triển sự nghiệp biểu diễn...",
      "seoBio": "Tìm vé concert trực tiếp tại TicketBox...",
      "status": "COMPLETED",
      "createdAt": "2026-07-11T04:20:00Z"
    }
    ```

#### 3. Phê duyệt & Đăng tải Tiểu sử nghệ sĩ lên Trang Vé Concert
*   **URL:** `/api/artist/bio/:id/approve` (Với `:id` là ID bản ghi Bio nghệ sĩ hoặc `concertId`)
*   **Method:** `PUT`
*   **Body (JSON):**
    ```json
    {
      "shortBio": "Phiên bản chỉnh sửa ngắn của admin (nếu có)",
      "mediumBio": "Phiên bản chỉnh sửa vừa của admin (nếu có)",
      "seoBio": "Phiên bản chỉnh sửa SEO của admin (nếu có)"
    }
    ```
*   **Mô tả:** Admin kiểm tra nội dung do AI sinh ra, có thể chỉnh sửa lại chữ nghĩa trực tiếp trong body gửi lên. Sau khi được duyệt (`APPROVED`), nội dung `mediumBio` của nghệ sĩ sẽ tự động được ghi đè vào MongoDB `ShowInfo.artistBio` của Concert đó, cập nhật ngay lập tức giao diện bán vé cho khách hàng.
*   **Response (200 OK):**
    ```json
    {
      "id": "e3e8f7a8-1212-4c7b-8b5e-ea784cf8db92",
      "status": "APPROVED",
      "publishedAt": "2026-07-11T04:22:00.000Z"
    }
    ```
