import { AppDataSource } from '../config/data-source';

export async function initTestDb() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();
}

// Dọn sạch dữ liệu giữa các test, giữ nguyên schema (nhanh hơn drop/migrate lại).
export async function truncateAll() {
  const tables = [
    'audit_logs',
    'liquidation_logs',
    'sterilization_logs',
    'borrow_items',
    'borrow_forms',
    'kit_items',
    'tool_kits',
    'medical_tools',
    'users',
    'tool_categories',
    'departments',
  ];
  await AppDataSource.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
}

export async function closeTestDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
