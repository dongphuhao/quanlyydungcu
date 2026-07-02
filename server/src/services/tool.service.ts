import { AppDataSource } from '../config/data-source';
import { MedicalTool, LiquidationLog, ToolStatus, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listTools() {
  return AppDataSource.getRepository(MedicalTool).find({ order: { code: 'ASC' } });
}

export interface UpsertToolInput {
  id?: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  totalQuantity: number;
  status: ToolStatus;
  entryDate: string;
  note?: string | null;
}

export async function upsertTool(input: UpsertToolInput, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(MedicalTool);
    const existing = input.id ? await repo.findOneBy({ id: input.id }) : null;
    const before = existing ? { ...existing } : null;

    // Thêm mới: khả dụng = tổng số lượng. Sửa: giữ nguyên khả dụng hiện có (đúng hành vi persistence.ts cũ).
    const availableQuantity = existing ? existing.availableQuantity : input.totalQuantity;

    const saved = await repo.save(
      repo.create({
        id: existing?.id,
        code: input.code,
        name: input.name,
        type: input.type,
        unit: input.unit,
        totalQuantity: input.totalQuantity,
        availableQuantity,
        status: input.status,
        entryDate: input.entryDate,
        note: input.note ?? null,
      })
    );

    await recordAudit({
      manager,
      user: actor,
      action: existing ? 'UPDATE' : 'INSERT',
      entityType: 'medical_tool',
      entityId: saved.id,
      beforeState: before,
      afterState: saved,
      details: existing ? `Sửa dụng cụ: ${saved.name}` : `Thêm dụng cụ: ${saved.name}`,
    });
    return saved;
  });
}

export async function adjustStock(id: string, amount: number, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(MedicalTool);
    // Khoá dòng trong transaction để tránh race condition khi nhiều người điều chỉnh tồn kho cùng lúc.
    const tool = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!tool) throw new Error('Không tìm thấy dụng cụ');
    if (tool.availableQuantity + amount < 0) throw new Error('Số lượng tồn kho không thể âm');

    const before = { ...tool };
    tool.availableQuantity += amount;
    tool.totalQuantity += amount;
    const saved = await repo.save(tool);

    await recordAudit({
      manager,
      user: actor,
      action: 'UPDATE',
      entityType: 'medical_tool',
      entityId: id,
      beforeState: before,
      afterState: saved,
      details: `${amount > 0 ? 'Nhập thêm' : 'Điều chỉnh giảm'} ${Math.abs(amount)} ${tool.name}`,
    });
    return saved;
  });
}

export async function liquidateTool(id: string, quantity: number, reason: string, notes: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const toolRepo = manager.getRepository(MedicalTool);
    const tool = await toolRepo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!tool) throw new Error('Không tìm thấy dụng cụ');
    if (quantity <= 0 || tool.availableQuantity < quantity) {
      throw new Error(`Không thể thanh lý nhiều hơn số lượng hiện có (${tool.availableQuantity})`);
    }

    const before = { ...tool };
    tool.availableQuantity -= quantity;
    tool.totalQuantity -= quantity;
    await toolRepo.save(tool);

    const logRepo = manager.getRepository(LiquidationLog);
    const log = await logRepo.save(
      logRepo.create({ toolId: id, quantity, reason, notes, performedBy: actor.fullName, date: new Date() })
    );

    await recordAudit({
      manager,
      user: actor,
      action: 'UPDATE',
      entityType: 'medical_tool',
      entityId: id,
      beforeState: before,
      afterState: tool,
      details: `Thanh lý ${quantity} dụng cụ ${tool.name}: ${reason}`,
    });
    return log;
  });
}
