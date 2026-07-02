# Y Dụng Cụ — Quản lý y dụng cụ & đồ vải y tế

Hệ thống quản lý dụng cụ phẫu thuật và gói mổ cho bệnh viện. Kiến trúc: `client/` (React + Vite) gọi REST API của `server/` (Node/Express + TypeORM + PostgreSQL). Xem `CLAUDE.md` để biết đầy đủ bối cảnh, quyết định kiến trúc và phạm vi đã/chưa làm.

## Chạy cục bộ

**Yêu cầu:** Node.js 20+, PostgreSQL (hoặc Docker để chạy Postgres cục bộ qua `server/docker-compose.yml`).

### 1. Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env      # chỉnh DB_*, SESSION_SECRET nếu cần
docker compose up -d      # tuỳ chọn: khởi động PostgreSQL cục bộ qua Docker
npm run migration:run     # tạo schema
npm run seed              # dữ liệu demo
npm run dev                # http://localhost:4000
```

Tài khoản demo sau khi seed: `admin/admin`, `manager/123`, `requester/123`, `viewer/viewer`.

### 2. Frontend (`client/`)

```bash
cd client
npm install
npm run dev                # http://localhost:3000 (proxy /api sang server:4000)
```

### Kiểm thử

```bash
cd server && npm run lint && npm test   # cần tạo database quanlyydungcu_test trước
cd client && npm run lint
```

## Cấu trúc thư mục

```
client/    React 19 + TypeScript + Vite — UI, gọi REST API qua client/services/api.ts
server/    Node.js + Express + TypeORM — REST API, business logic, audit log, auth
```
