import { AppDataSource } from '../config/data-source';
import { ToolKit, KitItem, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listKits() {
  return AppDataSource.getRepository(ToolKit).find({ order: { code: 'ASC' } });
}

export interface UpsertKitInput {
  id?: string;
  code: string;
  name: string;
  type: string;
  totalQuantity: number;
  items: { toolId: string; quantity: number }[];
}

export async function upsertKit(input: UpsertKitInput, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const kitRepo = manager.getRepository(ToolKit);
    const existing = input.id ? await kitRepo.findOneBy({ id: input.id }) : null;
    const before = existing ? { ...existing, items: existing.items } : null;

    const kit = kitRepo.create({
      id: existing?.id,
      code: input.code,
      name: input.name,
      type: input.type,
      totalQuantity: input.totalQuantity,
      // Thêm mới: toàn bộ số lượng ở trạng thái trong kho. Sửa: giữ nguyên phân bổ hiện có (đúng hành vi persistence.ts cũ).
      inStockQuantity: existing ? existing.inStockQuantity : input.totalQuantity,
      borrowedQuantity: existing?.borrowedQuantity ?? 0,
      waitingSterilizationQuantity: existing?.waitingSterilizationQuantity ?? 0,
      sterilizingQuantity: existing?.sterilizingQuantity ?? 0,
      damagedQuantity: existing?.damagedQuantity ?? 0,
      liquidatedQuantity: existing?.liquidatedQuantity ?? 0,
      items: input.items.map((it) =>
        manager.getRepository(KitItem).create({ toolId: it.toolId, quantity: it.quantity })
      ),
    });

    const saved = await kitRepo.save(kit);

    await recordAudit({
      manager,
      user: actor,
      action: existing ? 'UPDATE' : 'INSERT',
      entityType: 'tool_kit',
      entityId: saved.id,
      beforeState: before,
      afterState: saved,
      details: existing ? `Sửa gói: ${saved.name}` : `Tạo gói: ${saved.name}`,
    });
    return saved;
  });
}
