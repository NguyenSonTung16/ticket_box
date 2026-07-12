# Đặc tả: Đặt vé và Sơ đồ ghế (Booking & Seat Map)

## Mô tả
Tính năng cho phép khán giả xem thông tin chi tiết sự kiện, tương tác với sơ đồ ghế (chọn ghế SVIP đích danh hoặc số lượng vé tự do VIP/Normal), và tiến hành khóa vé tạm thời trước khi thanh toán. Tính năng này đóng vai trò sống còn trong việc ngăn chặn tranh chấp vé (Zero Seat Clash) dưới tải trọng cực cao, đồng thời đảm bảo hiển thị đồng bộ số lượng vé và trạng thái ghế theo thời gian thực.

## Luồng chính

### 1. Luồng xem thông tin và Sơ đồ ghế (Info Flow & Caching)
- **Bước 1 (Truy cập):** Khán giả truy cập trang chi tiết sự kiện. Browser gửi HTTP GET `/api/concerts/{id}` đến Nginx Load Balancer, Nginx phân phối request xuống một trong các App Server Replicas.
- **Bước 2 (Chống Cache Stampede với SingleFlight):** 
  - App Server kiểm tra Local Cache (Tier 1) và Redis Cluster (Tier 2). 
  - Nếu Cache Miss, tính năng **SingleFlight (Mutex Lock)** sẽ khóa luồng truy cập trên cấp độ App Server. Chỉ 1 request đại diện được phép truy vấn Database gốc (MongoDB lấy mô tả sự kiện, PostgreSQL lấy cấu hình vé). Các request khác sẽ đứng chờ kết quả từ request đại diện, tuyệt đối bảo vệ CSDL khỏi làn sóng 80.000 users.
- **Bước 3 (Khởi tạo kết nối SSE):** Trình duyệt mở kết nối một chiều Server-Sent Events (SSE) để lắng nghe thay đổi trạng thái ghế và số lượng vé còn lại liên tục từ App Server.
- **Bước 4 (Tương tác sơ đồ):** Khán giả xem sơ đồ ghế SVIP (định dạng SVG tương tác) hoặc số lượng kho vé tự do. Các ghế trống (AVAILABLE) được highlight để chọn, các ghế đang khóa (RESERVED) hoặc đã mua (BOOKED) hiển thị màu xám.

### 2. Luồng chọn vé và Khóa vé tạm thời (Booking / Reservation Flow)

Luồng được chia làm 2 chiến lược riêng biệt tùy thuộc vào phân khu:

#### Kịch bản 2A: Đặt vé Phân khu Vé Thường (VIP, Normal - Khối lượng K)
- **Bước 1 (Chọn số lượng):** Khán giả chọn mua số lượng $K$ vé.
- **Bước 2 (Giữ chỗ thần tốc trên Redis):** App Server kiểm tra giới hạn bằng `INCRBY` trên Per-User Counter và trừ kho tổng bằng `HINCRBY kho_tổng -K`. Nếu đủ số dư và không vượt giới hạn, Redis ghi nhận khóa vé tạm thời. *KHÔNG ghi trạng thái PENDING xuống PostgreSQL để tránh "Hot Row"*.
- **Bước 3 (Chờ thanh toán):** Hệ thống đẩy 1 Delayed Message (10 phút) vào RabbitMQ làm bộ đếm ngược giải phóng vé.

#### Kịch bản 2B: Đặt vé Phân khu SVIP (Đặt ghế đích danh)
- **Bước 1 (Chọn ghế):** Khán giả click chọn từng ghế cụ thể trên sơ đồ SVG.
- **Bước 2 (Kiểm tra Quota cá nhân):** App Server dùng lệnh `HLEN user:{userId}:concert:{id}:zone:svip` để kiểm tra tổng số ghế SVIP mà người dùng đang khóa. Nếu vượt quá `ticketLimit`, từ chối ngay.
- **Bước 3 (Khóa vị trí bằng Trọng tài Redis):** App Server thực thi lệnh nguyên tử `HSETNX` lên Redis Hash Map của sơ đồ ghế. Nếu trả về `1` (thành công), tiến sang bước tiếp theo. Nếu trả về `0`, ghế đã bị giật, trả lỗi HTTP 400.
- **Bước 4 (Chốt chặn Database - Synchronous Write):** App Server thực hiện lệnh đồng bộ: `UPDATE seat_inventory SET status='RESERVED', reservedBy=:userId WHERE seatNo=:seat AND status='AVAILABLE'`. Đây là chốt chặn vật lý bảo vệ tính toàn vẹn. Nếu thành công, ghế chính thức thuộc về người dùng trong 10 phút.

### 3. Đồng bộ thời gian thực (Real-time Broadcast)
- Sau khi khóa vé (hoặc giải phóng vé do hết hạn), hệ thống phát thông điệp trạng thái ghế/vé lên kênh **Redis Pub/Sub**.
- Toàn bộ các Node.js Replicas trong Cluster lắng nghe kênh này, cập nhật Local Cache độc lập trên mỗi máy chủ, và lập tức phát luồng **SSE** xuống tất cả trình duyệt đang kết nối. Sơ đồ ghế sẽ đổi màu đồng loạt mà không cần tải lại trang.

### 4. Cơ chế Phòng chờ (Virtual Queue) và Chia tải (Load Balancing)
- **Chia tải Stateless:** Luồng booking hoàn toàn phi trạng thái, session được lưu tập trung trên Redis, giúp hệ thống Scale-Out vô hạn theo chiều ngang đằng sau Load Balancer.
- **Phòng chờ đặt ghế (Waiting Room):** Trong phút đầu mở bán, hệ thống xếp hàng khán giả qua Redis Sorted Set/Token Bucket. Load Balancer chỉ xả traffic an toàn (vd: 1000 users/s) vào luồng thực thi, số còn lại sẽ ở trang chờ để bảo vệ kiến trúc chống hiện tượng Cascading Failure.

## Kịch bản lỗi

- **Hết hạn giữ vé (Hold Timeout Rollback & CRON Fallback):** Sau 10 phút nếu khán giả không thanh toán, hệ thống có 2 lớp bảo vệ để giải phóng ghế:
  - **Lớp 1 (Real-time):** RabbitMQ Worker xử lý Delayed Message (10 phút) để trả vé bằng `HINCRBY` (vé thường) hoặc `HSETNX` nhả field (SVIP), đồng thời trừ Quota cá nhân và `UPDATE` PostgreSQL để nhả khóa. Sau đó phát Pub/Sub + SSE cập nhật giao diện.
  - **Lớp 2 (CRON Fallback):** Để phòng ngừa sự cố mất message trên RabbitMQ khiến ghế bị kẹt vĩnh viễn (Orphaned Seats), một CRON Job chạy ngầm định kỳ mỗi phút sẽ quét toàn bộ Database. Bất kỳ ghế nào ở trạng thái `RESERVED` có `expiryTime` bé hơn giờ hiện tại sẽ bị ép nhả về `AVAILABLE` và đồng bộ ngược lên Redis.
- **Lỗi Redis Cluster trung tâm mất kết nối:** Tính năng Fallback kéo dài TTL của Local Cache trên App Server để tiếp tục phục vụ luồng xem thông tin mà không làm sập Database. 
- **Lệch pha dữ liệu / Redis PubSub delay:** Thời gian TTL của Local Tier-1 cực ngắn (1 giây) đảm bảo dữ liệu trên các cụm Node.js Replica tự động đồng bộ lại số liệu mới nhất trong vòng 1 giây, khắc phục tình trạng Stale Data.

## Ràng buộc

- **Zero Seat Clash:** Giao dịch đặt ghế SVIP bắt buộc dựa vào lệnh nguyên tử đơn luồng `HSETNX` của Redis làm "trọng tài tối cao".
- **Database Protection:** Luồng thông tin (đọc) tuyệt đối phải qua Two-Tier Cache (Local RAM + Redis) kết hợp Mutex Lock (SingleFlight), Database PostgreSQL/MongoDB không phục vụ traffic user trực tiếp.
- **Đồng bộ phi trạng thái:** Truyền phát thông tin sự kiện thời gian thực xuống Client bắt buộc sử dụng Pub/Sub + SSE, không phụ thuộc vào trạng thái WebSocket server-bound cục bộ.

## Tiêu chí chấp nhận

- **Hiệu năng cực hạn:** Xử lý mượt mà kịch bản Flash Sale với 80.000 user truy cập trong 5 phút đầu. 
- **Không xảy ra tranh chấp vé:** Hai người bấm đặt cùng một ghế SVIP ở cùng một mili-giây, hệ thống chỉ duyệt cho một người và từ chối người còn lại.
- **Hiển thị thời gian thực:** Sơ đồ SVG hoặc số lượng vé còn lại tự động cập nhật mượt mà (đổi màu / nhảy số) trên toàn bộ các trình duyệt đang xem chỉ trong vòng dưới 2 giây.
- **Giải phóng kho vé chuẩn xác:** Khán giả treo vé 10 phút không thanh toán, hệ thống tự động nhả vé và sơ đồ ghế phục hồi màu trống mà không gây thất thoát tổng lượng vé.
