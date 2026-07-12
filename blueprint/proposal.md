# TicketBox — Project Proposal

## Vấn đề
Hiện nay, việc bán vé các sự kiện âm nhạc quy mô vừa và lớn bằng các kênh truyền thống (như Zalo OA, tạo Google Form, hay yêu cầu khách hàng chuyển khoản thủ công chụp ảnh màn hình gửi qua tin nhắn) bộc lộ hàng loạt hạn chế nghiêm trọng khi lượng khách hàng quan tâm tăng đột biến:
*   **Hệ thống sập nguồn do quá tải:** Các website hoặc Form không được thiết kế kiến trúc chịu tải, lập tức cạn kiệt kết nối vào cơ sở dữ liệu khiến toàn bộ dịch vụ "trắng trang" khi hàng vạn người ùa vào cùng lúc.
*   **Trừ tiền không ra vé:** Quá trình chốt đơn và đối soát thanh toán kém, dẫn đến lỗi bất đồng bộ mạng. Khách hàng đã bị trừ tiền trong tài khoản ngân hàng nhưng hệ thống bị nghẽn nên không phát hành vé, gây phẫn nộ và khủng hoảng truyền thông.
*   **Hiện tượng Bot gom vé (Scalper):** Thiếu cơ chế kỹ thuật để cản trở, tạo điều kiện cho phe vé dùng Bot tự động vét sạch vé tốt trong tích tắc.
*   **Hiển thị vé ảo:** Trạng thái vé bị trễ nải do cơ chế Cache không hợp lý, khiến khách F5 liên tục thấy còn vé nhưng bấm mua thì báo hết, gây ức chế tột độ.

## Mục tiêu
Hệ thống cần đạt được các quy chuẩn khắt khe về kỹ thuật và vận hành:
*   **Khả năng chịu tải cực cao:** Đảm bảo hệ thống đứng vững, phục vụ mượt mà **80.000 người truy cập đồng thời (CCU)** trong 5 phút đầu tiên mở bán mà không sập.
*   **Đồng bộ thời gian thực (Real-time):** Phản ánh chính xác số vé còn lại ngay trên sơ đồ ghế với độ trễ < 1 giây, tự động nhảy số không cần khán giả phải bấm F5 trang.
*   **Tự động hóa thanh toán tuyệt đối:** Chống trừ tiền hai lần, đảm bảo "1 vé 1 chủ" rõ ràng ngay trong môi trường cạnh tranh cao.

## Người dùng và nhu cầu
*   **Khán giả (Audience):** 
    *   *Mục đích:* Lấy được thông tin sự kiện nhanh nhất, giữ vé và thanh toán thành công.
    *   *Điều quan trọng nhất:* Sự công bằng (không bị Bot cướp vé) và tính an toàn (thanh toán đúng số tiền, nhận đúng mã QR). Trải nghiệm săn vé cần mượt mà, không giật lag.
*   **Ban tổ chức (Organizer):** 
    *   *Mục đích:* Quản lý thông tin show diễn, cập nhật thông tin nghệ sĩ, giá vé.
    *   *Điều quan trọng nhất:* Import danh sách vé nội bộ/VIP cực nhanh bằng file CSV thay vì nhập tay. Có AI hỗ trợ tạo hồ sơ nghệ sĩ tự động từ các tài liệu PDF/Word hỗn tạp.
*   **Nhân viên soát vé (Check-in Staff):** 
    *   *Mục đích:* Quét mã QR tại cổng ra vào sân vận động.
    *   *Điều quan trọng nhất:* Tốc độ thông quan siêu tốc (< 1 giây/người) để giải tỏa đám đông 50.000 người, thiết bị bắt buộc phải hoạt động được dù nhà mạng di động bị sập sóng ở khu vực sự kiện.

## Phạm vi
### Những gì thuộc phạm vi đồ án này:
*   Thiết kế kiến trúc Microservices phân tách nghiệp vụ (Auth, Booking, Info, Checkin, AI, Worker).
*   Triển khai Hybrid Caching đa tầng kết hợp Server-Sent Events (SSE) để tối ưu Load Database và push dữ liệu real-time.
*   Cơ chế xếp hàng Virtual Waiting Room & chống double-charge qua Redis.
*   Kiến trúc hướng sự kiện (RabbitMQ) để xử lý Webhook thanh toán bù đắp khi lỗi mạng.
*   Giải pháp thiết bị soát vé Offline-First (cơ sở dữ liệu cục bộ, đồng bộ chéo sau khi có mạng).
*   Tích hợp quy trình tải file CSV lên MinIO để import vé theo lô.
*   Tích hợp AI (Google Gemini) phân tích văn bản tự nhiên.

### Những gì KHÔNG thuộc phạm vi đồ án này:
*   Tích hợp môi trường Payment Gateway thật (tiền thật), chỉ sử dụng môi trường Sandbox của PayPal/VNPay để mô phỏng webhook.
*   Triển khai hạ tầng Production vật lý thực tế trên AWS/Kubernetes (toàn bộ đồ án chạy mô phỏng kiểm thử giới hạn thông qua Docker Compose ở local).
*   Đảm bảo chống rò rỉ thông tin, kiểm thử thâm nhập (Penetration Testing) hay các tiêu chuẩn bảo mật dữ liệu doanh nghiệp chuyên sâu (như PCI-DSS cho thanh toán). Hệ thống chỉ tập trung giải quyết bài toán hiệu năng và kiến trúc luồng dữ liệu.

## Rủi ro và ràng buộc
Quá trình thiết kế phải đối mặt và giải quyết các bài toán kỹ thuật hóc búa đã biết trước:
*   **Tải đột biến (Surge Load):** Nguy cơ sập hệ thống (DDoS nội bộ). *Giải quyết:* Cấp token vào phòng chờ ảo (Waiting Room).
*   **Tranh chấp vé (High Contention):** Hàng ngàn người tranh 1 ghế. *Giải quyết:* Khóa bi quan ở cấp độ bộ nhớ (Redis Pessimistic Locking).
*   **Cổng thanh toán không ổn định:** Bị timeout hoặc gọi Webhook chậm/trùng lặp. *Giải quyết:* Khóa lũy đẳng (Idempotency) 3 lớp lưu trạng thái giỏ hàng.
*   **Soát vé Offline:** Rủi ro sao chép lậu mã QR qua hai cổng không có mạng. *Giải quyết:* Đồng bộ bất đồng bộ và xử lý phạt nguội dữ liệu vé lậu thay vì khóa cứng quy trình.
*   **Tích hợp một chiều CSV:** Rủi ro sai lệch format cột dữ liệu đầu vào. *Giải quyết:* Xây dựng hàng rào Validator tự động ngắt chuỗi tiến trình.
*   **Phân quyền và chức năng tài khoản:** Ràng buộc hệ thống có nhiều loại vai trò chuyên biệt (Khán giả, Ban tổ chức, Nhân viên soát vé, Người duyệt AI). *Giải quyết:* Xây dựng ma trận phân quyền (RBAC) khắt khe trên từng Endpoint bằng JWT Guard, đảm bảo không có sự giao thoa quyền hạn (Ví dụ: Khán giả tuyệt đối không thể gọi API soát vé, Nhân viên soát vé không thể sửa thông tin sự kiện).
