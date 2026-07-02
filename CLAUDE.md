# CLAUDE.md

Tài liệu định hướng cho Claude Code khi làm việc trong repo này. Đọc kỹ trước khi sửa code.

## 0. Bối cảnh quan trọng — đọc trước khi làm bất cứ việc gì

Repo đã chuyển sang kiến trúc thật: `client/` (React + Vite) gọi REST API của `server/` (Node/Express + TypeORM + PostgreSQL) — xem chi tiết trạng thái ở mục 8. `client/services/persistence.ts` và `client/services/mockData.ts` là **bản prototype cũ dùng localStorage**, được sinh từ Google AI Studio, **KHÔNG còn được import ở đâu trong app nữa** — chỉ giữ lại làm tài liệu tham khảo nghiệp vụ/UI đã duyệt. Nguồn sự thật cho business logic bây giờ là `server/src/services/*`.

**KHÔNG được tiếp tục dùng `localStorage` làm nơi lưu trữ dữ liệu nghiệp vụ.** Không thêm tính năng mới vào `client/services/persistence.ts` theo kiểu cũ. Mọi tính năng mới phải được thiết kế theo kiến trúc REST API + PostgreSQL ở mục 3, thêm endpoint/service tương ứng trong `server/`.

## 1. Mục tiêu cuối cùng của dự án

Đây **không phải** là prototype hay demo. Mục tiêu là xây dựng **hệ thống thật, dùng vận hành trong bệnh viện** để quản lý y dụng cụ mổ và đồ vải y tế.

Yêu cầu bắt buộc của hệ thống:

- **Multi-user** — nhiều người dùng thao tác đồng thời, dữ liệu nhất quán.
- **PostgreSQL** làm database chính thức.
- Chạy trong **mạng LAN nội bộ** bệnh viện (không phụ thuộc cloud/internet ra ngoài).
- **Authentication** thật (không phải session giả lưu localStorage như bản cũ).
- **Audit Log** đầy đủ cho mọi thao tác thay đổi dữ liệu.
- **Backup** dữ liệu định kỳ.
- **Restore** từ bản backup.
- **Import Excel** (nhập danh sách dụng cụ/gói/tồn kho từ file Excel).
- **Export Excel** (xuất báo cáo/danh sách ra Excel).
- **Barcode** (in và quét mã vạch cho dụng cụ/gói mổ).
- **Dashboard** tổng quan tồn kho, hoạt động mượn/trả, cảnh báo.
- **Phân quyền** theo vai trò (role-based access control).
- **API** — toàn bộ frontend giao tiếp với backend qua REST API, không truy cập DB trực tiếp.

## 2. Kiến trúc bắt buộc

```
React 19 + TypeScript + Vite        (Frontend)
              ↓
          REST API
              ↓
    Node.js + Express                (Backend)
              ↓
        PostgreSQL                    (Database)
```

Ghi chú quan trọng về kiến trúc:

- Đây là kiến trúc bắt buộc cho giai đoạn hiện tại. Backend (Node.js/Express) **có thể được thay thế bằng .NET API** trong tương lai:

  ```
  React 19 + TypeScript + Vite
              ↓
            .NET API
              ↓
          PostgreSQL
  ```

  Frontend (React 19 + TypeScript + Vite) và database (PostgreSQL) **giữ nguyên** khi đổi backend — chỉ tầng API ở giữa bị thay thế.

- **Hệ quả bắt buộc**: để việc đổi backend sau này chỉ là swap tầng API mà không phải viết lại frontend, **toàn bộ business logic (validate tồn kho, state machine mượn/trả, tính toán số lượng, quy tắc phân quyền...) phải nằm ở backend**, expose ra ngoài qua REST API. Frontend chỉ được gọi API và hiển thị/gửi dữ liệu — **không tính toán nghiệp vụ ở phía client**, không giữ "nguồn sự thật" (source of truth) nào ở client ngoài cache hiển thị tạm thời.
- Frontend không được kết nối thẳng tới PostgreSQL hay bất kỳ hình thức truy cập DB trực tiếp nào — luôn đi qua REST API.

## 3. Cấm dùng localStorage cho dữ liệu nghiệp vụ

- `localStorage`/`sessionStorage` chỉ được dùng cho state UI thuần túy phía client (ví dụ: tab đang mở, theme) — **không bao giờ** dùng để lưu tools, kits, borrow forms, users, logs... Những dữ liệu này thuộc về PostgreSQL, truy xuất qua REST API.
- `services/persistence.ts` hiện tại là **code legacy tham khảo nghiệp vụ**, không phải nơi để mở rộng. Khi implement backend thật, logic trong file này (state machine mượn/trả, validate số lượng, ghi log...) cần được **port sang backend Node/Express + PostgreSQL**, không copy nguyên xi cách lưu trữ.
- Authentication thật (bảng `users` trong PostgreSQL, mật khẩu hash, JWT/session server-side) phải thay thế hoàn toàn cơ chế `localStorage.setItem('surgitrack_session', ...)` đang có.

## 4. Audit Log bắt buộc

Mọi thao tác sau đây **bắt buộc phải ghi vào Audit Log** ở backend (bảng riêng trong PostgreSQL, không phải mảng in-memory):

- `INSERT`
- `UPDATE`
- `DELETE`
- `APPROVE`
- `REJECT`
- `LOGIN`
- `LOGOUT`

Mỗi bản ghi audit log tối thiểu cần có: người thực hiện (user id), hành động, entity/id bị tác động, thời gian (server time, không phải client time), và chi tiết thay đổi (nên lưu cả trạng thái trước/sau khi khả thi). Đây là nâng cấp bắt buộc so với `SystemLog`/`addLog()` hiện tại trong bản cũ (vốn chỉ lưu chuỗi mô tả, không có before/after, và sống trong localStorage).

Không được bỏ qua audit log cho bất kỳ endpoint nào thuộc nhóm hành động trên, kể cả khi thao tác thất bại do lỗi nghiệp vụ (validate không qua) — cân nhắc ghi log cả các lần từ chối/lỗi quan trọng (ví dụ login sai).

## 5. Domain nghiệp vụ

Phạm vi nghiệp vụ (đã được xác nhận, giữ nguyên khi thiết kế schema PostgreSQL/API mới):

- **Dụng cụ y tế** đơn lẻ (`MedicalTool`): số lượng tổng, số lượng khả dụng, trạng thái (tốt / đang mượn / hỏng / chờ tiệt trùng / thanh lý).
- **Gói mổ** (`ToolKit`/"kit"): tập hợp nhiều dụng cụ, theo dõi số lượng theo từng trạng thái (tồn kho, đang mượn, chờ tiệt trùng, đang tiệt trùng, hỏng, thanh lý).
- **Nhập/xuất tổng thể dụng cụ**: điều chỉnh tồn kho tổng, thanh lý dụng cụ.
- **Xuất/nhập gói mổ cho khoa phòng**: quy trình mượn–trả gói mổ (không mượn lẻ dụng cụ trong gói).
- Quản lý khoa phòng, loại dụng cụ, người dùng/phân quyền, dashboard/báo cáo.

> **Gap cần làm rõ**: nghiệp vụ gốc yêu cầu quản lý cả "đồ vải y tế" (surgical linens/gowns/drapes — vòng đời khác dụng cụ kim loại, thường theo dõi qua số lần giặt/hấp thay vì "thanh lý"). Data model hiện tại (`types.ts`) chưa có entity riêng cho việc này. Khi thiết kế schema PostgreSQL, hỏi rõ người dùng có cần bảng/luồng riêng cho đồ vải hay mở rộng `MedicalTool` là đủ.

### Quy trình mượn/trả (state machine bắt buộc phải giữ khi viết lại ở backend)

```
Requested → (duyệt) → Active → (khoa phòng gửi yêu cầu trả) → ReturnRequested
   → (duyệt trả) → Sterilizing → (hoàn tất tiệt trùng từng phần) → Completed
Requested/ReturnRequested → (từ chối) → Rejected / quay lại Active
```

Chi tiết từng bước (tham khảo logic hiện có trong `services/persistence.ts`, cần port sang API endpoint tương ứng ở backend):

1. **Tạo yêu cầu mượn** — khoa phòng tạo phiếu mượn gói mổ, sinh mã phiếu theo mã khoa phòng, status = `Requested`.
2. **Duyệt mượn** — admin/manager duyệt: kiểm tra tồn kho gói đủ, trừ tồn kho, cộng số lượng đang mượn, status = `Active`.
3. **Yêu cầu trả** — khoa phòng gửi yêu cầu trả, status = `ReturnRequested`.
4. **Duyệt trả** — admin/manager xác nhận trả: chuyển số lượng đang mượn sang chờ tiệt trùng, tạo bản ghi tiệt trùng cho từng gói, status = `Sterilizing`.
5. **Tiệt trùng** — CSSD xử lý theo từng bản ghi tiệt trùng (bắt đầu/hoàn tất); khi **tất cả** bản ghi của phiếu đã hoàn tất, phiếu mượn tự chuyển `Completed`.
6. **Từ chối** — từ chối yêu cầu mượn (→ `Rejected`) hoặc từ chối yêu cầu trả (→ quay lại `Active`).

Khi implement lại ở backend: **luôn giữ bất biến số lượng** — tổng (tồn kho + đang mượn + chờ tiệt trùng + đang tiệt trùng) của một gói phải khớp với tổng số lượng trừ phần đã thanh lý/hỏng. Việc kiểm tra bất biến này nên có ở tầng service/backend (transaction PostgreSQL), không tin tưởng dữ liệu gửi từ client. Mọi thao tác đổi số lượng phải ghi Audit Log (mục 4).

## 6. Phân quyền (Role)

`Role` hiện có: `admin | manager | requester | viewer | user`.

- `admin`: toàn quyền, gồm cả quản lý khoa phòng/loại dụng cụ/tài khoản.
- `manager`: vận hành đầy đủ nghiệp vụ (mượn/trả/tiệt trùng/thanh lý/báo cáo) nhưng không quản lý danh mục hệ thống hay tài khoản.
- `requester`/`user`: chỉ được tạo yêu cầu mượn, xem phiếu đang giữ, xem lịch sử.
- `viewer`: chỉ xem dashboard và báo cáo.

Phân quyền phải được **enforce ở backend** (middleware kiểm tra role trên từng endpoint), không chỉ ẩn/hiện UI ở frontend. Danh sách quyền theo tab/action nên là một nguồn cấu hình duy nhất dùng chung giữa frontend và backend (tránh lặp lại kiểu `ROLE_PERMISSIONS` bị khai báo trùng ở cả `App.tsx` và `Layout.tsx` như bản cũ).

## 7. Design system — Trắng & Xanh dương

Yêu cầu: tối giản, hiện đại, chuyên nghiệp, nền trắng, màu chủ đạo xanh dương. Convention kế thừa từ bản cũ (Tailwind CSS), giữ nguyên khi làm frontend mới:

- Nền trang: `bg-gray-50`; nền card/sidebar/modal: `bg-white` với `border-gray-200`.
- Màu nhấn/hành động chính: `blue-600` (active state, nút chính, badge), hover nhẹ dùng `blue-50`/`blue-600` cho text.
- Text: `text-gray-900` (chính), `text-gray-600` (phụ).
- Trạng thái cảnh báo/badge số đếm dùng `red-500`; tránh thêm màu ngoài hệ trắng-xanh-xám trừ khi biểu thị lỗi/cảnh báo.
- Bo góc `rounded-lg`, spacing theo Tailwind scale mặc định, transition mượt, phong cách phẳng (flat) — tránh gradient/shadow nặng.
- Icon: SVG outline-style (stroke, không fill), chuẩn Heroicons outline 24x24.

## 8. Trạng thái migration hiện tại

Backend "core" đã dựng xong (client/server tách monorepo, schema PostgreSQL, auth session, audit log, RBAC, toàn bộ CRUD + state machine mượn/trả/tiệt trùng/thanh lý port từ `persistence.ts` sang `server/src/services/*`, frontend đã nối API thật). Chi tiết còn lại:

- **Chưa làm** (để phase sau, xem mục 10 cũ đã chốt hướng nhưng chưa implement):
  - Backup/restore PostgreSQL định kỳ (pg_dump/restore) — chưa có script/lịch chạy.
  - Import/Export Excel qua backend — hiện tại **export vẫn ở frontend** bằng `xlsx` (giữ nguyên như bản cũ, `App.tsx` hàm `exportToExcel`); chưa có **import** Excel ở cả frontend lẫn backend.
  - Bảng `medical_linens` (đồ vải y tế) — đã chốt là bảng riêng (không mở rộng `MedicalTool`), nhưng entity/migration/API chưa tạo.
  - Barcode: không đổi, vẫn `jsbarcode` thuần frontend (hiển thị/in, không phải nguồn dữ liệu) — đúng như dự kiến ban đầu.
- Không xóa `client/services/persistence.ts`/`mockData.ts` khi chưa có sự đồng ý — vẫn giữ làm tài liệu tham khảo dù không còn được import.
- Khi thêm tính năng backend mới: entity → `server/src/entities/`, migration tay trong `server/src/migrations/` (chưa dùng `migration:generate` tự động vì cần Postgres sống để introspect), business logic + audit log trong `server/src/services/`, route/controller mỏng chỉ gọi service.

## 9. Lệnh phát triển

Frontend (`client/`):
```bash
cd client
npm run dev       # dev server (port 3000, proxy /api sang server 4000)
npm run build     # build production
npm run preview   # preview bản build
npm run lint      # tsc --noEmit
```

Backend (`server/`) — cần PostgreSQL đang chạy (xem `server/docker-compose.yml` để chạy Postgres cục bộ qua Docker, hoặc dùng Postgres có sẵn + `server/.env` trỏ tới):
```bash
cd server
cp .env.example .env        # chỉnh DB_*, SESSION_SECRET nếu cần
docker compose up -d        # tuỳ chọn: Postgres cục bộ qua Docker
npm run migration:run       # tạo schema
npm run seed                # dữ liệu demo — admin/admin, manager/123, requester/123, viewer/viewer
npm run dev                 # server dev (port 4000)
npm run lint                # tsc --noEmit
npm test                    # Vitest — cần thêm DB test riêng (tạo database quanlyydungcu_test)
```

## 10. Quyết định kiến trúc đã chốt (không hỏi lại trừ khi người dùng muốn đổi)

- **Cấu trúc**: monorepo `client/` + `server/`.
- **ORM**: TypeORM (entity + decorator, migration viết tay trong `server/src/migrations/`).
- **Auth**: session lưu server-side trong PostgreSQL (`express-session` + `connect-pg-simple`), không dùng JWT. Cookie `ydungcu.sid`, httpOnly, 8 giờ.
- **RBAC**: nguồn cấu hình duy nhất ở `server/src/config/permissions.ts` (`ROLE_PERMISSIONS`, `ROLE_GROUPS`) — frontend không tự khai báo nữa, luôn đọc `allowedTabs` từ `GET /api/auth/me`.
- **Test**: Vitest cho backend (`server/src/**/*.test.ts`), chưa có test frontend.
- **Đồ vải y tế**: bảng riêng `medical_linens` khi implement (chưa implement — xem mục 8).

Việc còn cần hỏi người dùng khi bắt đầu: chiến lược Backup/Restore cụ thể cho PostgreSQL, và cách xử lý Import Excel (validate ở đâu, cho phép ghi đè hay chỉ thêm mới).
