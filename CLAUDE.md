# CLAUDE.md

Tài liệu định hướng cho Claude Code khi làm việc trong repo này. Đọc kỹ trước khi sửa code.

## 0. Bối cảnh quan trọng — đọc trước khi làm bất cứ việc gì

Code hiện có trong repo (`App.tsx`, `services/persistence.ts`, `components/*`) là **bản prototype cũ dùng localStorage**, được sinh từ Google AI Studio. Bản này **KHÔNG còn là kiến trúc đích** của dự án — chỉ giữ lại làm tài liệu tham khảo cho nghiệp vụ và UI đã được duyệt. Dự án đang trong quá trình chuyển từ prototype sang hệ thống production thật.

**KHÔNG được tiếp tục dùng `localStorage` làm nơi lưu trữ dữ liệu nghiệp vụ.** Không thêm tính năng mới vào `services/persistence.ts` theo kiểu cũ. Mọi tính năng mới phải được thiết kế theo kiến trúc REST API + PostgreSQL ở mục 3, kể cả khi phải viết lại từ đầu logic đang có trong `persistence.ts`.

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

- Repo hiện tại **chưa có backend** — chỉ có frontend React + localStorage (bản cũ). Khi bắt đầu xây dựng backend thật, cần tách rõ cấu trúc thư mục (ví dụ `client/` cho React và `server/` cho Node/Express), hoặc dùng monorepo layout — **bàn với người dùng trước khi tái cấu trúc thư mục lớn**, đừng tự ý di chuyển file hàng loạt.
- Không xóa code cũ trong `services/persistence.ts`/`components/*` khi chưa có sự đồng ý — coi là tài liệu tham khảo cho tới khi tính năng tương ứng đã có bản thay thế chạy qua API thật.
- Việc chọn ORM/migration tool cho PostgreSQL (Prisma, TypeORM, Knex, hay raw SQL + node-postgres), cách tổ chức Express (routes/controllers/services), và chiến lược backup/restore (pg_dump theo lịch, hay công cụ khác) **chưa được quyết định** — hỏi người dùng trước khi chọn, đừng tự ý quyết định khi bắt đầu code phần backend.
- Import/Export Excel: bản cũ đã có `xlsx` ở frontend cho export — khi có backend, cân nhắc chuyển xử lý file (đặc biệt import) sang backend để validate dữ liệu trước khi ghi PostgreSQL, tránh xử lý Excel không kiểm soát ở client.
- Barcode: bản cũ dùng `jsbarcode` ở frontend để in — giữ lại được vì đây là hiển thị/in ấn thuần túy, không phải nguồn dữ liệu.

## 9. Lệnh phát triển hiện tại (frontend cũ — sẽ cập nhật khi có backend)

```bash
npm run dev       # chạy dev server frontend (port 3000)
npm run build     # build production
npm run preview   # preview bản build
npm run lint      # thực chất là `tsc --noEmit`
```

Chưa có lệnh cho backend (chưa tồn tại) và chưa có test runner nào được cấu hình. Khi thêm backend/test, cập nhật lại mục này.

## 10. Việc cần hỏi lại người dùng trước khi tự quyết

- Cấu trúc thư mục monorepo cho client/server.
- ORM/migration tool và cách tổ chức code backend (Express routes/controllers/services).
- Chiến lược Backup/Restore cụ thể cho PostgreSQL.
- Cơ chế Authentication cụ thể (JWT vs session, thời hạn token, refresh token...).
- Thiết kế entity riêng cho "đồ vải y tế" hay mở rộng entity dụng cụ hiện có.
- Test framework khi bắt đầu viết test cho backend/frontend mới.
