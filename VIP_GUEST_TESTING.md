# Hướng Dẫn Test Tính Năng Import VIP Guest CSV

Tài liệu này hướng dẫn cách sử dụng các script để tự động tạo file CSV dữ liệu mẫu và chuẩn bị dữ liệu ghế ngồi (`seat_inventory`) trong Database để test tính năng Import Khách Mời VIP mà không bị lỗi "Seat not found".

## Danh sách Script
1. **`generate-vip-csv.ts`**: Tạo ngẫu nhiên một file CSV với danh sách khách mời (số lượng tùy chọn). Đảm bảo chuẩn format validation của hệ thống.
2. **`seed-seats-for-csv.ts`**: Đọc file CSV vừa tạo, và tự động tạo (hoặc cập nhật) dữ liệu ghế trong Database khớp hoàn toàn với số ghế trong file CSV, đồng thời gán cho Event và Sponsor cụ thể.

---

## Các Bước Thực Hiện Test

### Bước 1: Sinh ra file CSV Khách Mời VIP
Mở terminal tại thư mục gốc của project và chạy lệnh sau để sinh ra file CSV. Bạn có thể truyền vào số lượng bản ghi muốn tạo (ví dụ 500 dòng).

```bash
npx ts-node src/scripts/generate-vip-csv.ts 500
```
**Kết quả:** File `generated_vip_guests.csv` sẽ được tạo ra tại thư mục gốc của project chứa 500 khách mời với mã ghế hợp lệ (ví dụ: `A-112`, `VIP-25`).

### Bước 2: Chuẩn bị Dữ liệu Database (Seed Seats)
Hệ thống yêu cầu các số ghế trong file CSV phải **thực sự tồn tại** trong sự kiện đó và **được gán cho nhà tài trợ (sponsor)** tương ứng. 

Hãy chạy script seed để insert toàn bộ 500 ghế vừa random vào Database. Bạn cần xác định 2 tham số:
- **Show ID**: ID của sự kiện bạn đang test trên giao diện (Ví dụ: `39`).
- **Sponsor ID**: Mã của nhà tài trợ (Thường xuất hiện trong tên file CSV khi gọi API get presigned URL, ví dụ tên file `1_17838...csv` thì Sponsor ID là `1`).

Chạy lệnh sau:
```bash
npx ts-node src/scripts/seed-seats-for-csv.ts <showId> <sponsorId>

# Ví dụ cho Show 39 và Sponsor 1:
npx ts-node src/scripts/seed-seats-for-csv.ts 39 1
```
**Kết quả:** Script sẽ tự động chèn/cập nhật 500 ghế vào DB. Bạn sẽ thấy thông báo số ghế được insert thành công.

*Lưu ý: Script kết nối tới PostgreSQL sử dụng các biến môi trường trong file `.env` (DB_USERNAME, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).*

### Bước 3: Upload và Import trên Giao Diện
Bây giờ, bạn quay lại màn hình **Organizer Center**, ở trang quản lý Khách mời VIP của Show vừa cấu hình:
1. Click nút **Upload File**.
2. Chọn file `generated_vip_guests.csv` vừa tạo ở thư mục gốc.
3. Chờ file upload và Background Worker xử lý.
4. Tải lại/kiểm tra màn hình lịch sử, toàn bộ 500 dòng sẽ báo **"Bản ghi hợp lệ"** và không còn lỗi *"Seat not found"*.
