import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';
import { env } from './config/env';

async function main() {
  await AppDataSource.initialize();
  console.log('Đã kết nối PostgreSQL.');

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server đang chạy tại http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Không thể khởi động server:', err);
  process.exit(1);
});
