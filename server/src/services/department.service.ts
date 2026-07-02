import { AppDataSource } from '../config/data-source';
import { Department, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listDepartments() {
  return AppDataSource.getRepository(Department).find({ order: { name: 'ASC' } });
}

export async function upsertDepartment(input: { id?: string; code: string; name: string }, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(Department);
    const existing = input.id ? await repo.findOneBy({ id: input.id }) : null;
    const before = existing ? { ...existing } : null;
    const saved = await repo.save(repo.create({ id: existing?.id, code: input.code, name: input.name }));
    await recordAudit({
      manager,
      user: actor,
      action: existing ? 'UPDATE' : 'INSERT',
      entityType: 'department',
      entityId: saved.id,
      beforeState: before,
      afterState: saved,
      details: existing ? `Sửa khoa phòng: ${saved.name}` : `Thêm khoa phòng: ${saved.name}`,
    });
    return saved;
  });
}

export async function deleteDepartment(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(Department);
    const existing = await repo.findOneBy({ id });
    if (!existing) throw new Error('Không tìm thấy khoa phòng');
    await repo.delete(id);
    await recordAudit({
      manager,
      user: actor,
      action: 'DELETE',
      entityType: 'department',
      entityId: id,
      beforeState: existing,
      details: `Xóa khoa phòng: ${existing.name}`,
    });
  });
}
