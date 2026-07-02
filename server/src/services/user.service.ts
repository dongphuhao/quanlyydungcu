import { AppDataSource } from '../config/data-source';
import { User } from '../entities';
import { recordAudit } from './auditLog.service';
import { hashPassword, toPublicUser } from './auth.service';

export interface UpsertUserInput {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  role: User['role'];
  departmentId?: string | null;
  password?: string; // bắt buộc khi tạo mới, tuỳ chọn khi sửa (bỏ trống = giữ mật khẩu cũ)
}

export async function listUsers() {
  const users = await AppDataSource.getRepository(User).find({ relations: ['department'], order: { username: 'ASC' } });
  return users.map(toPublicUser);
}

export async function upsertUser(input: UpsertUserInput, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(User);
    const existing = input.id ? await repo.findOne({ where: { id: input.id }, relations: ['department'] }) : null;

    if (!existing && !input.password) {
      throw new Error('Vui lòng nhập mật khẩu cho tài khoản mới');
    }

    const before = existing ? toPublicUser(existing) : null;
    const passwordHash = input.password ? await hashPassword(input.password) : existing!.passwordHash;

    const saved = await repo.save(
      repo.create({
        id: existing?.id,
        username: input.username.toLowerCase(),
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        departmentId: input.departmentId ?? null,
        passwordHash,
      })
    );
    const full = await repo.findOneOrFail({ where: { id: saved.id }, relations: ['department'] });

    await recordAudit({
      manager,
      user: actor,
      action: existing ? 'UPDATE' : 'INSERT',
      entityType: 'user',
      entityId: saved.id,
      beforeState: before,
      afterState: toPublicUser(full),
      details: existing ? `Sửa tài khoản: ${full.username}` : `Tạo tài khoản: ${full.username}`,
    });
    return toPublicUser(full);
  });
}

export async function deleteUser(id: string, actor: User) {
  if (id === actor.id) throw new Error('Bạn không thể xóa tài khoản của chính mình');
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(User);
    const existing = await repo.findOneBy({ id });
    if (!existing) throw new Error('Không tìm thấy tài khoản');
    await repo.delete(id);
    await recordAudit({
      manager,
      user: actor,
      action: 'DELETE',
      entityType: 'user',
      entityId: id,
      beforeState: toPublicUser(existing),
      details: `Xóa tài khoản: ${existing.username}`,
    });
  });
}
