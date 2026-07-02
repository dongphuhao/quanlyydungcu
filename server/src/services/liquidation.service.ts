import { AppDataSource } from '../config/data-source';
import { LiquidationLog } from '../entities';

export async function listLiquidationLogs() {
  return AppDataSource.getRepository(LiquidationLog).find({ order: { date: 'DESC' } });
}
