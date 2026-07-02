import { AppDataSource } from '../config/data-source';
import { ToolCategory, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listCategories() {
  return AppDataSource.getRepository(ToolCategory).find({ order: { name: 'ASC' } });
}

export async function upsertCategory(input: { id?: string; name: string }, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(ToolCategory);
    const existing = input.id ? await repo.findOneBy({ id: input.id }) : null;
    const before = existing ? { ...existing } : null;
    const saved = await repo.save(repo.create({ id: existing?.id, name: input.name }));
    await recordAudit({
      manager,
      user: actor,
      action: existing ? 'UPDATE' : 'INSERT',
      entityType: 'tool_category',
      entityId: saved.id,
      beforeState: before,
      afterState: saved,
      details: existing ? `Sửa loại dụng cụ: ${saved.name}` : `Thêm loại dụng cụ: ${saved.name}`,
    });
    return saved;
  });
}

export async function deleteCategory(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(ToolCategory);
    const existing = await repo.findOneBy({ id });
    if (!existing) throw new Error('Không tìm thấy loại dụng cụ');
    await repo.delete(id);
    await recordAudit({
      manager,
      user: actor,
      action: 'DELETE',
      entityType: 'tool_category',
      entityId: id,
      beforeState: existing,
      details: `Xóa loại dụng cụ: ${existing.name}`,
    });
  });
}
