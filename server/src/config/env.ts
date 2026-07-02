import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  db: {
    host: required('DB_HOST', 'localhost'),
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: required('DB_USER', 'postgres'),
    password: required('DB_PASSWORD', 'postgres'),
    database: required('DB_NAME', 'quanlyydungcu'),
  },
  sessionSecret: required('SESSION_SECRET', 'change-me-in-production'),
  isProduction: process.env.NODE_ENV === 'production',
};
