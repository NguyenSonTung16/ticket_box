# Đặc tả: Tạo Sự Kiện và Tích Hợp AI Artist Bio

## Mô tả

Tính năng gồm **hai luồng độc lập** phối hợp với nhau để tạo ra một sự kiện hoàn chỉnh tích hợp tiểu sử nghệ sĩ được sinh bởi AI.

### Luồng 1 — Tạo sự kiện (4-Step Wizard)

Ban tổ chức (Organizer) tạo sự kiện qua giao diện wizard 4 bước. Mỗi bước lưu dữ liệu tức thì vào DB và Redis Cache Draft. Khi hoàn thành bước 4, hệ thống tự động publish sự kiện lên trạng thái `ACTIVE` và đẩy message `EVENT_PUBLISHED` vào RabbitMQ để các module khác xử lý (thông báo, cache invalidation...).

| Bước | Dữ liệu lưu | Nơi lưu |
|---|---|---|
| Step 1 | Tên, địa điểm, hình ảnh, danh sách nghệ sĩ | MongoDB (`show_info`) |
| Step 2 | Ngày giờ diễn, loại vé, số lượng, giá | PostgreSQL (`concerts`, `event_ticket_types`, `zone_inventory`) |
| Step 3 | Slug URL, quyền riêng tư, sơ đồ chỗ ngồi | PostgreSQL + MongoDB |
| Step 4 | Thông tin thanh toán ngân hàng, VAT | MongoDB |

### Luồng 2 — Upload PDF và Sinh AI Artist Bio (Bất Đồng Bộ)

Organizer upload file PDF hồ sơ nghệ sĩ. API Server trả về `201 Created` **ngay lập tức** (không chờ AI xử lý). Toàn bộ quá trình đọc PDF, gọi AI, và lưu kết quả được thực hiện **ngầm** bởi một Background Worker riêng biệt.

Hai luồng liên kết với nhau qua `concertId`: sau khi Bio được sinh ra và được duyệt (`APPROVED`), dữ liệu nghệ sĩ sẽ được đính kèm trong response của `GET /api/events/:id`.

---

## Luồng chính

### Luồng 1: Tạo Sự Kiện (4-Step Wizard)

```
Organizer
    │
    ├─[1]─► POST /api/organizer/concerts/draft
    │           └─ PostgreSQL: INSERT Concert { organizer_id, status: DRAFT, current_step: 1 }
    │           └─ MongoDB: INSERT ShowInfo { showId }
    │           └─ Response 201: { event_id, status: DRAFT, current_step: 1 }
    │
    ├─[2-4]─► PUT /api/organizer/concerts/:id/steps/:step  (lần lượt từng bước)
    │           └─ Lưu dữ liệu theo step vào PostgreSQL / MongoDB
    │           └─ Redis: SETEX draft:{eventId} 86400 {mergedStepData}
    │           └─ Redis: DEL show_info:{eventId}  (invalidate preview cache)
    │           └─ Response: { step_completed, next_step }
    │
    └─[5]─► PUT /api/organizer/concerts/:id/steps/4  (bước cuối)
                └─ PostgreSQL: UPDATE Concert { status: ACTIVE }
                └─ Redis: DEL draft:{eventId}
                └─ Redis: DEL event_list:*  (invalidate list cache)
                └─ RabbitMQ: publish "EVENT_PUBLISHED" → { event_id }
                └─ Response 200: { event_id, status: ACTIVE, event_url }
```

### Luồng 2: Upload PDF → AI Bio (Bất Đồng Bộ)

```
Organizer
    │
    ├─[1]─► POST /api/artist/upload  (multipart/form-data: file PDF, concertId)
    │   [Yêu cầu: JWT + Permission AI_BIO_UPLOAD]
    │           │
    │           ├─ Validate: MIME type, kích thước file
    │           ├─ MinIO: PUT bucket "artist-documents" / object "{documentId}.pdf"
    │           ├─ PostgreSQL:
    │           │       INSERT ArtistDocument { id, concertId, fileUrl, status: PENDING }
    │           │       INSERT AiJob          { id, documentId, status: PENDING, retryCount: 0 }
    │           ├─ RabbitMQ: publish → queue "pdf-uploaded"
    │           │       payload: { jobId, documentId, fileUrl, rawText? }
    │           │
    │           └─► Response HTTP 201 { jobId, documentId }  ← TRẢ VỀ NGAY LẬP TỨC
    │
    └─[2]─► GET /api/ai/jobs/:jobId  (Frontend polling mỗi 3–5 giây)
                └─ Response: { status: "PENDING|EXTRACTING|SUMMARIZING|COMPLETED|FAILED" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Background — AiWorker (RabbitMQ consumer, prefetch=1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ├─[A]─ Nhận message từ queue "pdf-uploaded"
    │
    ├─[B]─ DB: UPDATE AiJob { status: "EXTRACTING" }
    │           └─ Nếu payload.rawText đủ dài (≥ 100 chars): dùng trực tiếp
    │           └─ Fallback: MinIO.downloadBuffer("artist-documents", "{documentId}.pdf")
    │                        → pdfParse(buffer) → rawText
    │
    ├─[C]─ DB: UPDATE AiJob { status: "SUMMARIZING" }
    │           └─ Fetch PromptTemplate { isActive: true } từ PostgreSQL
    │           └─ Build prompt: template.templateText.replace("{{RAW_ARTIST_TEXT}}", cleanedText)
    │           └─ Gemini API (model: gemini-2.5-flash, responseMimeType: application/json)
    │                 Response: { short_bio, medium_bio, seo_bio, seo_keywords }
    │
    ├─[D]─ DB: INSERT ArtistBio
    │           { concertId, jobId, promptTemplateId, shortBio, mediumBio, seoBio,
    │             status: "PENDING_REVIEW" }
    │
    ├─[E]─ DB: UPDATE AiJob { status: "COMPLETED" }
    │
    ├─[F]─ RabbitMQ: publish exchange "ai.exchange" → routing key "ai.bio.generated"
    │           payload: { bioId, concertId, jobId }
    │
    └─[G]─ channel.ack(msg)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Frontend — Skeleton Loader và hiển thị kết quả
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Polling GET /api/ai/jobs/:jobId  (interval 3–5 giây)
    │
    ├─ status ∈ { PENDING, EXTRACTING, SUMMARIZING }
    │       └─ Render: Skeleton Loader (placeholder card với CSS shimmer animation)
    │          Hiển thị text: "AI đang phân tích tài liệu..."
    │
    ├─ status = COMPLETED
    │       └─ Dừng polling
    │       └─ Gọi GET /api/artist/bio/:bioId
    │       └─ Render: Bio card đầy đủ (shortBio, mediumBio, seoBio)
    │       └─ Organizer có thể APPROVE hoặc REJECT qua
    │          PUT /api/artist/bio/:id/approve
    │
    └─ status = FAILED
            └─ Dừng polling
            └─ Hiển thị: Error state + errorMessage + nút "Thử lại"

Cơ chế Skeleton Loader (phiên bản hiện tại vs. mục tiêu):

  ┌─ Code hiện tại ──────────────────────────────────────────────┐
  │  API GET /api/ai/jobs/:jobId trả về { status }.              │
  │  Frontend tự tổ chức polling loop (setInterval hoặc          │
  │  useEffect). Khi status = COMPLETED, gọi thêm GET bio/:id.   │
  │  Chưa có component Skeleton chuẩn hóa trong codebase.        │
  └──────────────────────────────────────────────────────────────┘

  ┌─ Thiết kế mục tiêu ──────────────────────────────────────────┐
  │  Hook usePollAiJob(jobId, intervalMs=4000):                  │
  │    - Tự động poll đến khi status ∈ {COMPLETED, FAILED}       │
  │    - Expose: { status, bioId, error, isLoading }             │
  │  Component <AiBioCard>:                                      │
  │    - isLoading=true → render <SkeletonCard> (CSS shimmer)    │
  │    - isLoading=false, data → render bio thật                 │
  │    - error → render <ErrorState> + retry button              │
  └──────────────────────────────────────────────────────────────┘
```

---

## Kịch bản lỗi

| # | Tình huống | Hành vi Worker | Kết quả |
|---|---|---|---|
| E-1 | PDF extract ra text < 50 ký tự | Throw error → `handleJobError` | `AiJob.status = FAILED`, route DLQ |
| E-2 | Gemini API lỗi / trả về JSON sai schema | Auto-fallback sang **Mock AI Response** | Bio vẫn được tạo từ nội dung Mock; ghi `WARN` log |
| E-3 | Retry lần 1–2 (bất kỳ lỗi nào) | ACK message cũ, publish lại sau Exponential Backoff (retry#1: 4 giây, retry#2: 8 giây) | `AiJob.retryCount` tăng; `status = PENDING` |
| E-4 | Retry lần 3 (max reached) | `AiJob.status = FAILED`, `channel.reject(msg, false)` | Message vào Dead Letter Queue (DLQ), không retry thêm |
| E-5 | MinIO không tải được file PDF | Throw error → `handleJobError` → retry như E-3/E-4 | Tương tự |
| E-6 | Slug trùng khi tạo event Step 3 | `409 ConflictException { error: 'slug_taken' }` | Frontend highlight input, gợi ý slug khác |
| E-7 | Upload không có permission `AI_BIO_UPLOAD` | `403 ForbiddenException` | Không tạo ArtistDocument, không push queue |

---

## Ràng buộc

### Cấu hình hệ thống
| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Queue nhận PDF job | `pdf-uploaded` | Consumer: `AiWorker` |
| Exchange publish kết quả | `ai.exchange` | Routing key: `ai.bio.generated` |
| Worker prefetch | `1` | Xử lý 1 job tại 1 thời điểm |
| Gemini model | `gemini-2.5-flash` | Fallback sang Mock nếu API key trống |
| Số lần retry tối đa | `3` | Exponential backoff: 4s, 8s |
| MinIO bucket PDF | `artist-documents` | Object key: `{documentId}.{ext}` |
| Redis cache draft | TTL 86400 giây | Key: `draft:{eventId}` |

### Status transitions (AiJob)
```
PENDING → EXTRACTING → SUMMARIZING → COMPLETED
                                    ↘ FAILED  (lỗi không retry được hoặc max retry)
```

### Status transitions (ArtistBio)
```
PENDING_REVIEW → APPROVED
              → REJECTED
```

### Bảo mật & quyền
- `POST /api/artist/upload` + `POST /api/artist/generate-bio` + `PUT /api/artist/bio/:id/approve`: yêu cầu permission `AI_BIO_UPLOAD`
- `GET /api/artist/bio/:id`, `GET /api/artist/bios`: yêu cầu JWT hợp lệ

---

## Tiêu chí chấp nhận

| # | Tiêu chí | Cách kiểm tra |
|---|---|---|
| AC-1 | `POST /api/artist/upload` phải trả về `HTTP 201` trong vòng **500ms**, bất kể kích thước PDF | Đo response time với file PDF 20MB |
| AC-2 | `AiJob.status` chuyển đúng thứ tự: `PENDING → EXTRACTING → SUMMARIZING → COMPLETED` | Polling `GET /api/ai/jobs/:jobId` liên tục trong khi Worker xử lý |
| AC-3 | `ArtistBio` được INSERT với `status = 'PENDING_REVIEW'` ngay sau khi AI hoàn thành | `SELECT * FROM artist_bios WHERE jobId = ?` |
| AC-4 | Khi Gemini API lỗi, Bio vẫn được tạo từ Mock (không FAILED ngay lập tức) | Xóa `GEMINI_API_KEY`, upload PDF → kiểm tra bio được tạo |
| AC-5 | Job chỉ retry tối đa **3 lần** trước khi chuyển `FAILED` và vào DLQ | Tắt MinIO, upload PDF → quan sát `retryCount` và `status` |
| AC-6 | User không có `AI_BIO_UPLOAD` nhận `403` khi upload | Test với token không có permission |
| AC-7 | `GET /api/events/:id` trả về mảng `artists` kèm `shortBio` sau khi Bio `APPROVED` | End-to-end test toàn luồng |
| AC-8 | Tạo event 4 bước hoàn toàn không bị block bởi xử lý AI | Tạo event thành công mà không upload PDF |
| AC-9 | Frontend hiển thị Skeleton Loader khi job đang ở status `EXTRACTING` hoặc `SUMMARIZING` | Visual test trong trình duyệt |
