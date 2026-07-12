# Đặc tả: Tạo Sự Kiện và Tích Hợp AI Tạo Thông Tin Chi Tiết

## Mô tả

Tính năng gồm **hai luồng độc lập** phối hợp với nhau để tạo ra một sự kiện hoàn chỉnh tích hợp thông tin chi tiết sự kiện (event description, SEO keywords...) được sinh bởi AI. Việc bóc tách này đảm bảo API tạo sự kiện không bao giờ bị nghẽn (block) bởi thời gian chờ AI phân tích tài liệu.

- **Luồng 1 (Tạo sự kiện):** Ban tổ chức tạo sự kiện qua giao diện wizard 4 bước.
- **Luồng 2 (AI Phân Tích Thông Tin):** Quá trình đọc PDF (tài liệu sự kiện, proposal), gọi AI sinh nội dung chi tiết, và lưu kết quả được thực hiện ngầm bởi Background Worker. Frontend sử dụng kỹ thuật Polling kết hợp Skeleton Loader để tự động điền vào form khi hoàn tất.

---

## Luồng chính

### Luồng 1: Tạo Sự Kiện (4-Step Wizard)

```mermaid
sequenceDiagram
    autonumber
    actor Org as Organizer
    participant API as API Server
    participant DB as PostgreSQL/MongoDB
    participant Cache as Redis
    participant MQ as RabbitMQ

    Note over Org, MQ: Bước 1: Khởi tạo Draft
    Org->>API: POST /api/organizer/concerts/draft
    API->>DB: INSERT Concert {status: DRAFT, current_step: 1}
    API-->>Org: 201 Created {event_id, status: DRAFT}

    Note over Org, MQ: Bước 2-4: Lưu dữ liệu từng phần
    loop Mỗi khi qua bước mới
        Org->>API: PUT /api/organizer/concerts/:id/steps/:step
        API->>DB: Lưu dữ liệu (vé, config...)
        API->>Cache: Cập nhật cache (draft & preview)
        API-->>Org: 200 OK {step_completed, next_step}
    end

    Note over Org, MQ: Hoàn tất Publish (Bước 4)
    Org->>API: PUT /api/organizer/concerts/:id/steps/4
    API->>DB: UPDATE Concert {status: ACTIVE}
    API->>MQ: Publish "EVENT_PUBLISHED" payload: {event_id}
    API-->>Org: 200 OK {status: ACTIVE, event_url}
```

### Luồng 2: Upload Tài Liệu & AI Sinh Thông Tin Chi Tiết (Bất Đồng Bộ)

*Lưu ý: Luồng dưới đây đã được đơn giản hóa để mô tả tổng quan sự phối hợp giữa Frontend, API và Worker.*

```mermaid
sequenceDiagram
    autonumber
    actor Org as Organizer
    participant Front as Frontend (UI)
    participant API as API Server
    participant MinIO as MinIO
    participant DB as PostgreSQL
    participant Worker as AiWorker

    Note over Org, DB: 1. API Server xử lý Upload (Đồng bộ - Trả về ngay)
    Org->>Front: Chọn file PDF (Proposal/Kịch bản) & Bấm Upload
    Front->>API: POST /api/ai/upload-document (JWT + file)
    API->>MinIO: Lưu file PDF
    API->>DB: INSERT AiJob {status: PENDING, type: 'EVENT_DETAILS'}
    API-->>Front: 201 Created {jobId}

    Note over Front, Worker: 2. Xử lý ngầm (Worker) & Cập nhật UI (Frontend)
    par Phân tích tài liệu (Worker)
        Worker->>Worker: Tải PDF & Đọc text
        Worker->>DB: UPDATE AiJob {status: SUMMARIZING}
        Worker->>Worker: Gọi Gemini AI API sinh mô tả
        Worker->>DB: INSERT GeneratedContent {status: PENDING_REVIEW}
        Worker->>DB: UPDATE AiJob {status: COMPLETED}
    and Cập nhật UI (Frontend Polling)
        loop Mỗi 3-5 giây
            Front->>API: GET /api/ai/jobs/:jobId
            API-->>Front: {status}
            
            alt status == PENDING | EXTRACTING | SUMMARIZING
                Front->>Front: Hiển thị Skeleton Loader ở ô "Mô tả sự kiện"
            else status == COMPLETED
                Front->>Front: Tự động điền nội dung & Dừng Polling
            else status == FAILED
                Front->>Front: Hiển thị Error & Dừng Polling
            end
        end
    end
```

### Cơ chế Skeleton Loader: Hiện tại vs Ý tưởng thiết kế

Để Frontend biết khi nào cần hiển thị hiệu ứng đang tải (Skeleton Loader), hệ thống dựa vào `status` của `AiJob`.

| Tiêu chí | Code hiện tại đang hoạt động | Ý tưởng thiết kế (Mục tiêu) |
|---|---|---|
| **Quản lý Polling** | Frontend tự viết `setInterval` thủ công trong component để gọi API liên tục. | Sử dụng một custom hook `usePollAiJob(jobId, intervalMs)` tái sử dụng được, tự động quản lý vòng đời polling. |
| **Giao diện chờ (Loading)**| Dùng thẻ loading cơ bản hoặc text "Đang xử lý...". Chưa chuẩn hóa. | Tạo component `<SkeletonCard>` dùng CSS animation `shimmer` (nhấp nháy) để tạo cảm giác mượt mà và chuyên nghiệp. |
| **Hiển thị lỗi** | Alert error đơn giản. | Component `<ErrorState>` chuyên dụng kèm nút "Thử lại". |

---

## Kịch bản lỗi

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING: Khởi tạo
    PENDING --> EXTRACTING: Đọc PDF
    EXTRACTING --> SUMMARIZING: Extract Text OK
    SUMMARIZING --> COMPLETED: Gemini trả kết quả OK
    
    PENDING --> FAILED: Lỗi (Hết lượt retry)
    EXTRACTING --> FAILED: Text < 50 chars / Lỗi MinIO
    SUMMARIZING --> FAILED: Gemini timeout
    
    COMPLETED --> [*]
    FAILED --> [*]
```

| # | Tình huống | Hành vi Worker / Hệ thống | Kết quả |
| --- | --- | --- | --- |
| E-1 | PDF extract ra text < 50 ký tự | Throw error → `handleJobError` | `AiJob.status = FAILED`, đẩy vào Dead Letter Queue (DLQ) |
| E-2 | Gemini API lỗi / trả JSON sai | Auto-fallback sang **Mock AI Response** | Nội dung chi tiết vẫn được tạo từ dữ liệu Mock; ghi log cảnh báo |
| E-3 | Retry lần 1–2 (bất kỳ lỗi nào) | ACK message cũ, publish lại sau Exponential Backoff (4s, 8s) | `AiJob.retryCount` tăng; `status = PENDING` |
| E-4 | Retry lần 3 (max reached) | Không retry thêm, đẩy vào DLQ | `AiJob.status = FAILED`, ngừng xử lý |
| E-5 | Slug trùng khi tạo event Step 3 | API check trùng lặp và trả `409 Conflict` | Frontend báo lỗi, yêu cầu chọn slug khác |

---

## Ràng buộc

* **Cấu hình Queue:** Queue `pdf-uploaded` cấu hình `prefetch = 1` để Worker xử lý tuần tự, chống quá tải bộ nhớ.
* **Retry Policy:** Retry tối đa 3 lần với thời gian chờ tăng dần (Exponential backoff: 4s, 8s).
* **Phân quyền:** Cần có quyền `AI_DOCUMENT_UPLOAD` trong token JWT.

---

## Tiêu chí chấp nhận

* **AC-1:** Upload API `POST /api/ai/upload-document` phản hồi `HTTP 201` dưới 500ms ngay cả với file 20MB.
* **AC-2:** Tạo sự kiện 4 bước hoàn chỉnh mà không cần upload PDF (bỏ qua luồng AI) thì Sự kiện vẫn phải được tạo và `ACTIVE` thành công.
* **AC-3:** Frontend hiển thị Skeleton Loader ở ô văn bản khi job đang xử lý (Status `PENDING`, `EXTRACTING`, `SUMMARIZING`).
* **AC-4:** Khi Gemini API lỗi, thông tin chi tiết sự kiện vẫn được sinh ra dựa trên Mock Data thay vì báo lỗi toàn bộ hệ thống.
