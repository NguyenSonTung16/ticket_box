# Đặc tả: Import Danh Sách Khách Mời VIP từ CSV

## Mô tả

Tính năng cho phép Nhà Tài Trợ (Sponsor) import danh sách khách mời VIP vào hệ thống thông qua file CSV. Mục tiêu kỹ thuật cốt lõi là xử lý được file CSV có **hàng trăm nghìn dòng** mà **không gây tràn bộ nhớ RAM** và **không làm quá tải Database**.

### Giải pháp: Van Tiết Lưu (Stream Throttle)

Thay vì đọc toàn bộ file vào RAM rồi insert một lần, hệ thống sử dụng mô hình **Stream + Async Iterator + Batch Bulk Insert** để kiểm soát lưu lượng dữ liệu chạy qua Worker:

- File CSV được lưu vào **MinIO** (không xử lý trực tiếp trong RAM của API server)
- Một **RabbitMQ message** nhỏ gọi Worker xử lý file
- Worker **stream** file từ MinIO, đọc từng dòng qua `csv-parser` và `for await`
- Cứ đủ **1.000 dòng hợp lệ** thì **dừng stream** (`pause`), thực hiện **1 lần Bulk INSERT** vào DB, xong mới **tiếp tục** (`resume`)

RAM được tiêu thụ tối đa chỉ bằng kích thước của 1 batch (1.000 dòng), bất kể file lớn đến đâu.

### Các đối tượng tham gia

| Vai trò | Hành động |
|---|---|
| **Sponsor** | Upload file CSV chứa danh sách ghế + thông tin khách |
| **API Server** | Nhận file, lưu MinIO, tạo `ImportJob`, đẩy message vào RabbitMQ, trả `201` ngay |
| **GuestImportProcessor** | Worker tiêu thụ message, stream CSV, bulk insert vào DB |
| **Organizer** | Theo dõi tiến độ import qua `GET /api/imports/:jobId` |

### Cấu trúc CSV bắt buộc

```csv
seatNo,name,email
A-1,Nguyen Van A,a@example.com
A-2,Tran Thi B,b@example.com
```

| Cột | Bắt buộc | Mô tả |
|---|---|---|
| `seatNo` | ✅ | Format: `ROW-NUMBER` (ví dụ: `A-1`, `B-12`) |
| `name` | ✅ | Tên khách mời |
| `email` | ✅ | Email khách mời |

---

## Luồng chính

### Phase 1: Upload và Dispatch

```
Sponsor
    │
    └─[1]─► POST /api/guest/import  (multipart/form-data: file CSV, showId, sponsorId)
                │
                ├─ Validate: Content-Type phải là text/csv hoặc application/octet-stream
                ├─ [Pre-flight] Đọc chỉ dòng đầu tiên (header row) để kiểm tra columns
                │       └─ Header PHẢI chứa: seatNo, name, email
                │       └─ Nếu thiếu → 400 Bad Request ngay (trước khi lưu MinIO)
                │
                ├─ MinIO: PUT bucket "ticketbox-csv-imports"
                │         object key: "{showId}/{sponsorId}_{timestamp}.csv"
                │
                ├─ PostgreSQL: INSERT ImportJob
                │         { id (uuid), showId, sponsorId, fileKey, status: "PENDING",
                │           totalRows: 0, successCount: 0, errorCount: 0, processedRows: 0 }
                │
                ├─ RabbitMQ: publish → queue "vip_guest.import"
                │         payload: { jobId, fileKey, showId, sponsorId }
                │
                └─► Response HTTP 201: { jobId, status: "PENDING" }  ← TRẢ VỀ NGAY
```

### Phase 2: Stream Processing (Van Tiết Lưu)

```
GuestImportProcessor
(RabbitMQ consumer, prefetch=1 — chỉ nhận 1 message tại 1 thời điểm)
    │
    ├─[A]─ Nhận message từ queue "vip_guest.import"
    │
    ├─[B]─ Redis Distributed Lock (NX):
    │           SET lock:vip_import:{showId}:{sponsorId} {jobId} EX 1800 NX
    │           Nếu lock đã tồn tại → NACK (requeue=true) → chờ lần sau
    │
    ├─[C]─ DB: UPDATE ImportJob { status: "PROCESSING", startedAt: now() }
    │
    ├─[D]─ MinIO.getObjectStream("ticketbox-csv-imports", fileKey)
    │           → Readable stream (KHÔNG buffer toàn bộ file)
    │
    ├─[E]─ Tạo AsyncGenerator từ stream:
    │           stream.pipe(csvParser({ mapHeaders, mapValues }))
    │           → toCsvAsyncIterator(stream)  ← wrapper chuyển event-based sang async iterable
    │
    ├─[F]─ VAN TIẾT LƯU — vòng lặp for await:
    │   ┌────────────────────────────────────────────────────────────────┐
    │   │  for await (const row of csvAsyncIter) {                      │
    │   │    totalRows++                                                 │
    │   │    validated = validateRow(row)  // kiểm tra seatNo, name, email│
    │   │    if (validated) validBatch.push(validated)                  │
    │   │                                                                │
    │   │    if (validBatch.length >= BATCH_SIZE) {  // BATCH_SIZE = 1000│
    │   │      // ─── VALVE CLOSE (stream tự pause do for-await block) ─│
    │   │      await bulkInsertBatch(validBatch)    // Bulk INSERT 1 lần │
    │   │      // ─── VALVE OPEN (for-await tiếp tục đọc row tiếp theo) │
    │   │      validBatch = []                                           │
    │   │      await importJobRepo.update(jobId, { processedRows: totalRows })│
    │   │    }                                                           │
    │   │  }                                                             │
    │   │  // Flush batch cuối (< 1000 dòng)                            │
    │   │  if (validBatch.length > 0) await bulkInsertBatch(validBatch)  │
    │   └────────────────────────────────────────────────────────────────┘
    │
    │   [Cơ chế back-pressure tự nhiên:]
    │   Trong khi bulkInsertBatch() đang được await, vòng for-await
    │   KHÔNG đọc thêm row mới từ stream. csvParser dừng emit 'data' events.
    │   RAM được giới hạn tối đa = BATCH_SIZE rows = ~1.000 dòng.
    │
    ├─[G]─ MinIO: archiveCsvObject (move file sang thư mục "archived/")
    │
    ├─[H]─ DB: UPDATE ImportJob
    │           { status: COMPLETED | COMPLETED_WITH_ERRORS,
    │             totalRows, successCount, errorCount, errorDetails, completedAt }
    │
    ├─[I]─ RabbitMQ: publish → queue "notification_queue"
    │           { type: "VIP_IMPORT_COMPLETE", jobId, successCount, errorCount }
    │
    ├─[J]─ channel.ack(msg)
    │
    └─[K]─ Redis: DEL lock:vip_import:{showId}:{sponsorId}
```

### Phase 3: Bulk Insert per Batch

```
bulkInsertBatch(batch: ValidatedRow[]):
    │
    ├─ Với mỗi row trong batch:
    │       └─ SELECT seat FROM seat_inventory WHERE row=seatRow, number=seatNum, showId=?
    │               ├─ Không tìm thấy seat → skip + log error (seat not found)
    │               ├─ seat.sponsorId = null → skip + log error (public seat)
    │               └─ seat.sponsorId ≠ row.sponsorId → skip + log error (wrong sponsor)
    │
    ├─ ONE bulk INSERT (toàn bộ valid rows trong batch):
    │       INSERT INTO tickets (concert_id, seatNo, guestName, guestEmail, sponsorId, ...)
    │       ON CONFLICT (concert_id, seatNo) DO UPDATE SET guestName=..., guestEmail=...
    │       (Upsert: duplicate seatNo không gây lỗi, chỉ cập nhật thông tin khách)
    │
    └─ ONE bulk UPDATE seats:
            UPDATE seat_inventory SET status='SOLD'
            WHERE (row, number) IN (...pairs...) AND showId=?
```

### Theo dõi tiến độ từ phía Organizer

```
Organizer
    └─► GET /api/imports/:jobId  (polling mỗi 5 giây)
            └─ Response:
               {
                 status: "PENDING|PROCESSING|COMPLETED|COMPLETED_WITH_ERRORS|FAILED",
                 processedRows: 7500,    ← được cập nhật sau mỗi batch
                 totalRows: 10000,
                 successCount: 7450,
                 errorCount: 50,
                 errorDetails: [{ row: 12, seatNo: "A-5", reason: "Seat not found" }, ...]
               }
```

---

## Kịch bản lỗi

### Lỗi 1: Header CSV không hợp lệ (Pre-flight check)

- **Kích hoạt:** File CSV thiếu cột `seatNo`, `name`, hoặc `email` (kiểm tra từ header row đầu tiên)
- **Xử lý hiện tại:** Validation header xảy ra sau khi stream bắt đầu — Worker sẽ có lỗi `validateRow` liên tục cho toàn bộ file.
- **Thiết kế mục tiêu:** API Server đọc **chỉ ~200 bytes đầu tiên** của stream từ MinIO để check header, trả `400 Bad Request` ngay lập tức trước khi lưu file vào MinIO và đẩy vào queue.

### Lỗi 2: Row data không hợp lệ (Skip-and-Continue)

- **Kích hoạt:** Dòng CSV thiếu field, hoặc `seatNo` sai format (không phải `ROW-NUMBER`)
- **Xử lý hiện tại (đã implement):** Row bị skip, push vào `errors[]`. Các dòng hợp lệ khác tiếp tục xử lý bình thường.
- **Kết quả:** `ImportJob.status = COMPLETED_WITH_ERRORS`, `errorDetails` chứa danh sách lỗi kèm row number.

### Lỗi 3: Batch INSERT thất bại (Batch-level failure)

- **Kích hoạt:** DB connection timeout, constraint violation ở cấp batch
- **Xử lý hiện tại (đã implement):** Toàn bộ rows trong batch đó được log là lỗi. Worker tiếp tục xử lý batch tiếp theo (không dừng toàn bộ job).
- **Log:** `ERROR: Bulk insert failed for batch ending at row {N}: {message}`

### Lỗi 4: Lỗi không thể phục hồi (Wipe and Retry)

> **Đã làm được (hiện tại):** Khi Worker gặp lỗi unrecoverable (MinIO down, DB crash hoàn toàn), hệ thống:
> 1. Gắn tag `status=error` cho MinIO object (MinIO lifecycle rule sẽ xóa sau 30 ngày)
> 2. Update `ImportJob.status = FAILED`
> 3. `channel.nack(msg, false, false)` → RabbitMQ route message vào **Dead Letter Queue (DLQ)**
> 4. Xóa distributed Redis lock
>
> **Giới hạn:** DLQ không tự động retry. Dữ liệu đã insert một phần (batch 1–K thành công, batch K+1 fail) vẫn còn trong DB — không có rollback.

> **Thiết kế mục tiêu (Wipe and Retry):**
> Thêm endpoint hoặc DLQ consumer để Organizer có thể trigger re-process:
>
> ```
> POST /api/imports/:jobId/retry
>     │
>     ├─[1] Kiểm tra job.status = FAILED (chỉ retry khi đã fail)
>     │
>     ├─[2] WIPE — Xóa toàn bộ dữ liệu đã insert của job này:
>     │         DELETE FROM tickets WHERE importJobId = :jobId
>     │         UPDATE seat_inventory SET status='AVAILABLE'
>     │           WHERE seatNo IN (SELECT seatNo FROM tickets WHERE importJobId = :jobId)
>     │
>     ├─[3] RESET — Đặt lại trạng thái ImportJob:
>     │         UPDATE ImportJob SET status='PENDING', processedRows=0,
>     │           successCount=0, errorCount=0, errorDetails=[], startedAt=NULL
>     │
>     ├─[4] RE-ENQUEUE — Publish lại message vào queue:
>     │         RabbitMQ: publish → "vip_guest.import" { jobId, fileKey, showId, sponsorId }
>     │
>     └─[5] Response 202 Accepted: { jobId, status: "PENDING", message: "Job re-queued" }
> ```
>
> Cơ chế này đảm bảo tính **idempotency**: file gốc vẫn còn trong MinIO (chưa bị xóa khi job fail), có thể được đọc lại hoàn toàn từ đầu.

### Lỗi 5: Duplicate job cùng show + sponsor (Race condition)

- **Kích hoạt:** 2 sponsor upload đồng thời 2 file cho cùng `showId + sponsorId`
- **Xử lý hiện tại (đã implement):** Redis lock `NX` với TTL 30 phút. Worker thứ 2 không acquire được lock → `NACK (requeue=true)` → message quay lại queue, chờ lock được giải phóng.
- **Đảm bảo:** Không có 2 import job cho cùng show+sponsor chạy song song.

---

## Ràng buộc

### Cấu hình hệ thống
| Tham số | Giá trị | Ghi chú |
|---|---|---|
| MinIO bucket | `ticketbox-csv-imports` | Object key: `{showId}/{sponsorId}_{ts}.csv` |
| RabbitMQ queue | `vip_guest.import` | Consumer: `GuestImportProcessor` |
| Worker prefetch | `1` | 1 file tại 1 thời điểm — không overlap |
| `BATCH_SIZE` | `1.000 dòng` | Cân bằng giữa số round-trip DB và RAM usage |
| Redis lock TTL | `1800 giây` | Key: `lock:vip_import:{showId}:{sponsorId}` |
| MinIO error tag TTL | `30 ngày` | Lifecycle rule tự xóa object lỗi |

### Bộ nhớ (Memory Safety)
- **Tại mọi thời điểm**, Worker chỉ giữ tối đa `BATCH_SIZE = 1.000 rows` trong RAM
- `for await` tự động back-pressure stream: stream không emit thêm `data` khi `bulkInsertBatch()` đang `await`
- File CSV 500MB với 1 triệu dòng → RAM Worker chỉ tăng thêm ~vài MB (size của 1 batch)

### Bảo mật & quyền
- Sponsor chỉ được import vào show mà họ được phân quyền (`sponsorId` được gắn với `showId`)
- Seat phải thuộc `sponsorId` tương ứng — không thể ghi đè ghế của sponsor khác

### Hiệu năng
| Scenario | Kết quả mong đợi |
|---|---|
| File 10.000 dòng | < 30 giây (10 batch × ~3 giây/batch) |
| File 100.000 dòng | < 5 phút |
| 5 sponsor upload đồng thời | Tuần tự hóa qua queue — không crash |

### ImportJob status transitions
```
PENDING → PROCESSING → COMPLETED
                     → COMPLETED_WITH_ERRORS  (có row lỗi nhưng vẫn xử lý được)
                     → FAILED                 (lỗi unrecoverable)

FAILED ──[Wipe & Retry]──► PENDING → PROCESSING → ...
```

---

## Tiêu chí chấp nhận

| # | Tiêu chí | Cách kiểm tra |
|---|---|---|
| AC-1 | `POST /api/guest/import` trả về `HTTP 201` trong < **2 giây**, bất kể kích thước file CSV | Upload file CSV 50MB, đo response time |
| AC-2 | Worker xử lý file 100.000 dòng **không OOM** (RAM Worker không vượt 512MB) | Monitor process memory trong khi xử lý file lớn |
| AC-3 | `processedRows` được cập nhật sau mỗi batch — `GET /imports/:jobId` phản ánh tiến độ thực tế | Polling API trong khi Worker xử lý file lớn |
| AC-4 | Row thiếu field (`seatNo`, `name`, hoặc `email`) bị **skip** nhưng các row hợp lệ khác vẫn được insert | Upload file có 10 row hỗn hợp (valid + invalid) |
| AC-5 | Duplicate `seatNo` trong CSV được **upsert** (không gây lỗi, cập nhật thông tin mới nhất) | Upload file có 2 dòng cùng `seatNo` |
| AC-6 | 2 sponsor upload cùng `showId` đồng thời → Worker thứ 2 phải **chờ** (không xử lý song song) | Kiểm tra Redis lock; 1 job chờ cho đến khi job kia hoàn thành |
| AC-7 | Sau khi import thành công, `seat_inventory.status` của các ghế được import = `SOLD` | `SELECT status FROM seat_inventory WHERE seatNo IN (...)` |
| AC-8 | `errorDetails` chứa đúng `row number` và `seatNo` cho mỗi dòng lỗi | Import file CSV có các lỗi đã biết, so sánh `errorDetails` |
| AC-9 | **[Thiết kế mục tiêu]** `POST /imports/:jobId/retry` xóa sạch dữ liệu cũ của job và re-import thành công | Gây fail job, gọi retry endpoint, kiểm tra tickets cũ đã bị xóa và được tạo lại đúng |
| AC-10 | File CSV với header sai (thiếu cột) bị từ chối bằng `400 Bad Request` trước khi lưu MinIO | Upload file CSV không có cột `seatNo` |
