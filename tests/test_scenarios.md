# Kịch Bản Test (Test Scenarios) cho Event Service & CSV Import

Tài liệu này mô tả chi tiết các kịch bản kiểm thử (test scenarios) dựa trên các file `swagger.yaml` và `swagger-csv-import.yaml`. Các agent khác có thể đọc, sử dụng và chỉnh sửa tài liệu này để phục vụ cho việc tự động hóa kiểm thử (automation test) hoặc kiểm thử thủ công (manual test).

---

## 1. Event Service Flow (Dựa trên `swagger.yaml`)

### 1.1. Luồng Xác Thực (Authentication Flow)
- **Mục đích:** Đảm bảo hệ thống cấp phát và xác thực token chính xác cho Organizer.
- **Test cases:**
  - `POST /auth/register`: Đăng ký tài khoản Organizer mới. Xác minh trả về `201 Created` cùng với `accessToken` và `refreshToken`.
  - `POST /auth/login`: Đăng nhập với tài khoản vừa tạo. Xác minh trả về `200 OK` cùng token.
  - **Negative test:** Đăng nhập sai mật khẩu, đăng ký email trùng lặp.

### 1.2. Luồng Tạo Sự Kiện (Event Creation Flow - Organizer)
- **Mục đích:** Kiểm tra luồng tạo sự kiện gồm 4 bước của Organizer, đảm bảo trạng thái bản nháp (draft) được lưu và cập nhật chính xác.
- **Yêu cầu:** Gắn `Bearer Token` của Organizer.
- **Test cases:**
  - `POST /api/organizer/concerts`: Khởi tạo bản nháp. Xác minh `status: DRAFT` và `current_step: 1`. Lấy `event_id`.
  - `PUT /api/organizer/concerts/{id}/step/1`: Lưu thông tin chung (tên, địa điểm, v.v.). Xác minh `next_step: 2`.
  - `PUT /api/organizer/concerts/{id}/step/2`: Lưu thông tin thời gian và các loại vé (ticket_types). Xác minh `next_step: 3`.
  - `PUT /api/organizer/concerts/{id}/step/3`: Lưu cài đặt (slug, privacy). Xác minh `next_step: 4`.
  - `PUT /api/organizer/concerts/{id}/step/4`: Lưu thông tin thanh toán và Publish sự kiện. Xác minh `status: ACTIVE`.
  - `GET /api/organizer/concerts/{id}/draft`: Lấy thông tin bản nháp giữa các bước để đảm bảo dữ liệu được lưu đúng.
  - **Negative test:** Bỏ qua bước (gọi step 3 khi chưa xong step 2), truyền thiếu các trường bắt buộc, ngày bắt đầu (start_time) không hợp lệ.

### 1.3. Luồng Khách Hàng (Public Flow)
- **Mục đích:** Người dùng chưa đăng nhập có thể xem danh sách và chi tiết sự kiện đã `ACTIVE`.
- **Test cases:**
  - `GET /api/concerts`: Lấy danh sách sự kiện. Xác minh sự kiện vừa tạo (nếu privacy là PUBLIC) xuất hiện trong danh sách.
  - `GET /api/concerts/{id}`: Lấy chi tiết sự kiện bằng `event_id`. Xác minh các loại vé và thông tin trả về khớp với lúc tạo. Lấy trạng thái cache.

### 1.4. Luồng Quản Trị (Admin Event Management)
- **Mục đích:** Admin có quyền chỉnh sửa hoặc hủy sự kiện.
- **Test cases:**
  - `PUT /api/admin/concerts/{id}`: Cập nhật thông tin sự kiện (ví dụ: mô tả).
  - `DELETE /api/admin/concerts/{id}`: Hủy sự kiện. Xác minh trạng thái chuyển thành `CANCELLED`.

---

## 2. MinIO CSV Import & Upload Flow (Dựa trên `swagger-csv-import.yaml`)

### 2.1. Luồng Upload Ảnh (Organizer Upload)
- **Mục đích:** Lấy URL MinIO presigned để upload ảnh sự kiện, ảnh vé.
- **Test cases:**
  - `GET /api/organizer/concerts/{id}/upload-url`: Truyền query `type` (`image_url`, `cover_image_url`...) và `ext` (`jpg`, `png`...).
  - Xác minh trả về `presignedUrl`, `objectKey`, và `maxSizeBytes`.
  - **Negative test:** Truyền định dạng file (`ext`) hoặc loại ảnh (`type`) không được hỗ trợ. Bị từ chối truy cập (401/403) nếu không phải chủ sự kiện.

### 2.2. Luồng Import Khách Mời qua CSV (Admin Guests Import)
- **Mục đích:** Quản trị viên upload file CSV chứa danh sách khách mời cho một show và nhà tài trợ cụ thể, sau đó kích hoạt quá trình import và theo dõi tiến trình.
- **Test cases:**
  - **Bước 1:** `GET /api/admin/guests/csv-upload-url` (truyền `showId` và `sponsorId`). Nhận về `presignedUrl` và `objectKey`. (Có thể dùng mock client để mô phỏng việc PUT file CSV lên `presignedUrl`).
  - **Bước 2:** `POST /api/admin/guests/import`: Kích hoạt quá trình import. Body gửi kèm `fileKey` (nhận từ Bước 1), `showId`, `sponsorId`. Xác minh trả về `202 Accepted` với `job_id`.
  - **Bước 3:** `GET /api/admin/imports/{job_id}`: Poll endpoint này để kiểm tra trạng thái job (`PENDING` -> `PROCESSING` -> `COMPLETED`/`FAILED`).
    - Nếu thành công, kiểm tra `successCount`, `totalRows`.
    - Nếu có lỗi trong file CSV, kiểm tra cấu trúc mảng `errorDetails` (dòng nào lỗi, lý do gì, số ghế).
  - **Bước 4:** `GET /api/admin/imports`: Liệt kê danh sách các tác vụ import (có thể lọc theo `showId`).
  - **Negative test:** 
    - Gọi API trigger import với một `fileKey` đã được queue (xác minh trả về `409 Conflict`).
    - Thiếu thông tin `showId` hoặc `sponsorId`.

---

## Hướng dẫn sử dụng cho Agent khác
1. Khi viết integration test hoặc API test (như bằng Jest, Supertest hoặc Postman), hãy thực hiện các flow tuần tự (như tạo User -> tạo Event -> Publish -> Verify).
2. Lưu ý lấy các dữ liệu đầu ra ở bước trước (như `accessToken`, `event_id`, `job_id`, `fileKey`) truyền làm tham số cho các bước tiếp theo.
3. Khi file `swagger.yaml` cập nhật, hãy đồng bộ hóa lại file kịch bản này để phản ánh đúng cấu trúc và payload mới.
