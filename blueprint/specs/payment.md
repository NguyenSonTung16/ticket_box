# Đặc tả: Xử lý Thanh toán và Cấp phát vé (Payment & Webhook)

## Mô tả
Tính năng quản lý vòng đời thanh toán của khách hàng tính từ lúc bấm "Thanh Toán" (Checkout). Đảm bảo giao dịch tài chính diễn ra chính xác, an toàn, chống việc trừ tiền lặp lại (Double-charge), xử lý mượt mà kết quả trả về từ cổng thanh toán bên thứ ba (PayPal) thông qua Webhook, và xuất vé/hoá đơn thành công.

## Luồng chính
**Các thành phần tham gia:**
- **Frontend (Client):** Giao diện web/app của khách hàng.
- **Backend Service (`payment.service.ts`):** Nhận request, xử lý logic thanh toán.
- **Redis:** Lưu trữ tạm thời khóa chống trùng lặp (Idempotency) và khóa thanh toán (Payment Lock).
- **PostgreSQL:** Lưu trữ trạng thái Idempotency, thông tin vé, và hóa đơn.
- **PayPal Sandbox API:** Cổng thanh toán bên thứ ba để trừ tiền và hoàn tiền.
- **RabbitMQ:** Hệ thống hàng đợi để xử lý bất đồng bộ.
- **Worker Service (`worker.service.ts`):** Chạy ngầm để tạo hóa đơn, in vé, và phát tín hiệu Realtime (SSE).
1. **Khởi tạo Đơn hàng (`/payment/create-order`)**:
   - **Sinh khóa tại Frontend:** Ngay khi người dùng chuẩn bị thanh toán (vào trang Checkout), Trình duyệt sẽ tự động sinh ra một mã UUID (Idempotency Key) và lưu vào `sessionStorage('idempotency_key')`. Khi bấm nút "Thanh toán", khóa này được đính kèm vào Body gửi lên Backend cùng với chi tiết giỏ hàng.
   - Backend vào Redis tra cứu Idempotency Key này. Nếu không có, chèn một dòng vào bảng `idempotency_keys` ở PostgreSQL (trạng thái `PENDING`) để lưu cục JSON `requestPayload` (Danh sách mã ghế, số lượng vé tự do).
   - Backend gọi API sang cổng thanh toán PayPal để lấy mã đơn hàng (`paypalOrderId`) và trả URL thanh toán về cho trình duyệt. Trình duyệt chuyển hướng khách hàng sang PayPal.
2. **Nhận kết quả (Webhook)**:
   - Khi khách hàng trả tiền xong, PayPal bắn một HTTP Request ẩn (Webhook) về máy chủ TicketBox báo giao dịch hoàn tất.
   - Backend kiểm tra tính hợp lệ của Webhook (Verify Signature), sau đó đóng gói toàn bộ nội dung tin nhắn đẩy thẳng vào hệ thống Message Queue (RabbitMQ).
   - API Webhook lập tức ngắt kết nối và trả mã `200 OK` cho PayPal ngay lập tức (Chống Timeout).
3. **Xử lý cấp phát vé (Background Worker)**:
   - Các tiến trình Worker chạy ngầm bốc tin nhắn từ RabbitMQ ra để đọc.
   - Worker chui vào PostgreSQL đọc lại bảng `idempotency_keys` để biết giỏ hàng đó mua những ghế nào.
   - Cập nhật dữ liệu vào DB (PostgreSQL):
     - Tạo 1 bản ghi vào bảng `invoices`.
     - Tạo N bản ghi vào bảng `tickets` (Gắn kèm InvoiceId).
     - Đổi trạng thái trong `seat_inventory` từ `RESERVED` thành `BOOKED`.
     - Cập nhật số liệu vé vào `zone_inventory`.
     - Cập nhật Idempotency Key thành trạng thái `COMPLETED`.
4. **Phát tín hiệu Realtime (Pub/Sub & SSE)**:
   - Worker bắn một thông báo qua kênh Redis Pub/Sub: `{"seatNo": "A-1", "status": "BOOKED"}`.
   - Các Server Node nhận được tín hiệu sẽ tự động xóa bộ nhớ Cache cục bộ (RAM) và đẩy tín hiệu xuống các trình duyệt (Khán giả khác đang mở sơ đồ ghế) thông qua đường ống SSE.
   - Các ghế trên màn hình khách hàng tự động chuyển màu xám (Đã bán).

## Kịch bản lỗi
- **Khách hàng mạng lag, click nút "Thanh toán" 10 lần liên tục**: Nhờ Frontend cố định Idempotency Key, Backend sử dụng cơ chế `ON CONFLICT DO NOTHING` ở Database nên chặn đứng 9 yêu cầu dư thừa, không tạo ra 10 đơn hàng trên PayPal.
- **PayPal lỗi mạng, bắn tin nhắn Webhook 3 lần liên tiếp**: Khi Worker xử lý tin nhắn đầu tiên, Idempotency Key đổi thành `COMPLETED`. Ở tin nhắn thứ 2 và 3, Worker thấy trạng thái đã là `COMPLETED` thì chỉ ghi Log rồi bỏ qua, tránh việc tạo vé 3 lần.
- **Khách hàng bấm Thanh toán sát giờ (Sắp hết hạn giữ ghế)**: Nếu thời gian giữ ghế là 10 phút, và ở phút thứ 9:59 khách mới bấm sang PayPal. Lúc này Backend sẽ chủ động đặt một `payment_lock` (Khóa thanh toán) trên Redis có thời hạn 5 phút. Khi tiến trình Rollback Worker định thu hồi ghế ở phút thứ 10, nó sẽ thấy có `payment_lock` này và **tạm hoãn việc thu hồi thêm 5 phút nữa** để đợi khách trả tiền xong. Khách hàng sẽ không bị mất ghế oan uổng dù thanh toán sát giờ!
- **Khách hàng thanh toán trễ, bị cướp mất vé (Double Booking Prevention & Automated Refund)**: Nếu quá trình trừ tiền từ PayPal bị trì hoãn quá lâu khiến ghế vật lý (SVIP) bị Rollback nhả ra và người khác giành mất. Khi PayPal trả về lệnh thanh toán thành công (Capture Success), hệ thống chốt vé bằng SQL `UPDATE` có điều kiện. Lệnh này sẽ phát hiện ghế không còn trống và lập tức từ chối xuất vé (Ngăn chặn Double-Booking). Ngay lúc đó, hệ thống sẽ tự động gọi API `POST /v2/payments/captures/{capture_id}/refund` của PayPal để **hoàn tiền tự động** (Full hoặc Partial Refund) tùy thuộc vào số lượng vé bị hụt.
- **PostgreSQL Database bị sập giữa chừng**: Tin nhắn Webhook của PayPal đã được lưu an toàn vào hàng đợi Durable (RabbitMQ). Khi Database sống lại, Worker tự động chạy lại tin nhắn đang chờ và tiến hành cấp phát vé như bình thường. Khách hàng không bị trừ tiền oan uổng.
- **Server API Thanh toán bị sập (Downtime) khi PayPal gửi Webhook**: Nếu server chết ngay lúc PayPal đẩy HTTP request tới endpoint `/webhook`, kết nối sẽ thất bại (502 hoặc Timeout). PayPal có cơ chế tự động gửi lại (Webhook Retry Policy) với độ trễ tăng dần (Exponential Backoff) lên tới vài chục lần trong vòng vài ngày. Ngay khi Server API được boot lên lại, nó sẽ đón nhận request Webhook bị trễ này, đẩy vào RabbitMQ, và tiến trình cấp vé lại tiếp tục chạy hoàn hảo như chưa hề có cuộc chia ly.

## Ràng buộc
- **Tính Lũy đẳng tuyệt đối (Idempotency):** Một giỏ hàng dù được gửi yêu cầu 1.000 lần vẫn chỉ tạo ra duy nhất 1 giao dịch tài chính và 1 hóa đơn xuất vé.
- **Tính khả dụng cao (High Availability):** Endpoint `/webhook` không được phép sập và phải phản hồi cho PayPal trong thời gian cực ngắn (dưới 1s), do đó bắt buộc phải dùng Message Queue làm bộ đệm thay vì xử lý trực tiếp.
- **Tính toàn vẹn dữ liệu (Data Consistency):** Cấp vé, tạo hóa đơn, đổi trạng thái ghế phải nằm trong 1 phiên giao dịch (Database Transaction) hoặc theo cơ chế Eventual Consistency kiên cố.

## Tiêu chí chấp nhận
1.  Bảng `idempotency_keys` lưu lại đầy đủ thông tin `requestPayload` để phục vụ tiến trình Worker khi có Webhook trả về.
2.  Trường hợp thanh toán thành công, người dùng nhận được Hóa đơn (`invoices`) và Vé (`tickets`) đầy đủ trong Database gốc.
3.  Khi thanh toán thành công, ghế vừa mua trên sơ đồ phải thay đổi màu sắc ngay lập tức trên máy của hàng ngàn người dùng khác mà không cần tải lại trang (Nhờ Pub/Sub + SSE).
4.  Cố ý gọi Webhook giả bằng Postman với chữ ký không hợp lệ bị chặn ngay tại vòng gửi xe.
5.  Người dùng bị trừ tiền chính xác cho đơn hàng của mình và tuyệt đối không bao giờ bị trừ tiền 2 lần (Zero Double-Charge) nhờ cơ chế khóa Idempotency Key.
6.  Hệ thống đảm bảo khả năng phục hồi (Fault Tolerance): Khi hệ thống hoặc Database gặp sự cố sập nguồn, các tin nhắn giao dịch vẫn được lưu giữ an toàn trong Message Queue và tự động được lấy ra xử lý tiếp (cấp vé/tạo hóa đơn) ngay khi hệ thống sống trở lại, không bỏ sót bất kỳ đơn hàng nào.
