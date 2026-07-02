import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import {
  Department,
  ToolCategory,
  User,
  MedicalTool,
  ToolKit,
  KitItem,
  BorrowForm,
  BorrowItem,
  SterilizationLog,
  LiquidationLog,
  AuditLog,
} from '../entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: false,
  logging: !env.isProduction,
  entities: [
    Department,
    ToolCategory,
    User,
    MedicalTool,
    ToolKit,
    KitItem,
    BorrowForm,
    BorrowItem,
    SterilizationLog,
    LiquidationLog,
    AuditLog,
  ],
  migrations: ['src/migrations/*.ts'],
});
