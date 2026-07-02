import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { AuditLog, AuditAction, User } from '../entities';

export async function listAuditLogs() {
  return AppDataSource.getRepository(AuditLog).find({ order: { createdAt: 'DESC' }, take: 500 });
}

interface RecordAuditParams {
  manager: EntityManager;
  user: Pick<User, 'id' | 'fullName'> | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  details?: string;
  success?: boolean;
}

// Điểm ghi audit log DUY NHẤT — mọi service nghiệp vụ gọi qua đây, không tự ghi rải rác.
// Nhận EntityManager của transaction đang chạy để audit log commit/rollback cùng thao tác nghiệp vụ.
export async function recordAudit(params: RecordAuditParams): Promise<void> {
  const { manager, user, action, entityType, entityId, beforeState, afterState, details, success = true } = params;
  const repo = manager.getRepository(AuditLog);
  await repo.save(
    repo.create({
      userId: user?.id ?? null,
      userName: user?.fullName ?? 'Hệ thống',
      action,
      entityType,
      entityId: entityId ?? null,
      beforeState: beforeState ?? null,
      afterState: afterState ?? null,
      details: details ?? null,
      success,
    })
  );
}
