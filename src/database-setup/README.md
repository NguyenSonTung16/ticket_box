# Database Setup & Seeding

Thư mục này chứa các script dùng để khởi tạo dữ liệu mẫu (seed data) ban đầu cho hệ thống.

## Khởi tạo Schema (Cấu trúc bảng DB)
Bạn **không cần** chạy lệnh SQL thủ công nào để tạo bảng. Hệ thống sử dụng TypeORM và Mongoose, đã được cấu hình tự động tạo cấu trúc bảng (`synchronize: true`) vào lần đầu tiên chạy ứng dụng.

## Khởi tạo Dữ liệu mẫu (Seed Data)
Để khởi tạo dữ liệu mẫu lần đầu cho dự án, bạn chỉ cần chạy lệnh sau tại thư mục gốc:

```bash
npm run setup
```

Lệnh này sẽ thực hiện lần lượt các bước:
1. Tạo bucket trong MinIO (Lưu trữ ảnh).
2. Tạo dữ liệu Concerts, Zones, Tickets và đồng bộ lên Redis / Meilisearch.
3. Tạo dữ liệu Check-in mẫu cho tính năng soát vé.
