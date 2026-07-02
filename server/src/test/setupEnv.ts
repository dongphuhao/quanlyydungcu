// Chạy trước mọi test (vitest.config.ts -> setupFiles) — đảm bảo test luôn nhắm vào DB test riêng,
// không bao giờ đụng vào DB dev/production dù .env đang trỏ đâu.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'quanlyydungcu_test';
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_USER ??= 'postgres';
process.env.DB_PASSWORD ??= 'postgres';
process.env.SESSION_SECRET ??= 'test-secret';
