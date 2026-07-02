import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities';
import { getAllowedTabs } from '../config/permissions';
import { recordAudit } from './auditLog.service';

export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  role: User['role'];
  email: string;
  department?: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    email: user.email,
    department: user.department?.name,
  };
}

export async function verifyLogin(username: string, password: string): Promise<User | null> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { username: username.toLowerCase() }, relations: ['department'] });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function recordLoginAttempt(user: User | null, usernameTried: string, success: boolean) {
  await AppDataSource.transaction(async (manager) => {
    await recordAudit({
      manager,
      user: user ? { id: user.id, fullName: user.fullName } : null,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user?.id ?? null,
      details: success ? `Đăng nhập thành công: ${usernameTried}` : `Đăng nhập thất bại: ${usernameTried}`,
      success,
    });
  });
}

export async function recordLogout(user: Pick<User, 'id' | 'fullName'>) {
  await AppDataSource.transaction(async (manager) => {
    await recordAudit({ manager, user, action: 'LOGOUT', entityType: 'user', entityId: user.id, details: `Đăng xuất: ${user.fullName}` });
  });
}

export function buildMeResponse(user: User) {
  return { user: toPublicUser(user), allowedTabs: getAllowedTabs(user.role) };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
