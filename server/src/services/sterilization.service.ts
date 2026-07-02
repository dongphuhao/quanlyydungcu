import { AppDataSource } from '../config/data-source';
import { SterilizationLog, ToolKit, BorrowForm, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listSterilizationLogs() {
  return AppDataSource.getRepository(SterilizationLog).find({ order: { startedDate: 'DESC' } });
}

export async function startSterilization(logId: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const stRepo = manager.getRepository(SterilizationLog);
    const kitRepo = manager.getRepository(ToolKit);

    const stLog = await stRepo.findOne({ where: { id: logId } });
    if (!stLog) throw new Error('Không tìm thấy bản ghi tiệt trùng');
    if (stLog.status !== 'Waiting') throw new Error('Bản ghi không ở trạng thái chờ tiệt trùng');

    const kit = await kitRepo.findOne({ where: { id: stLog.packageId }, lock: { mode: 'pessimistic_write' } });
    if (!kit) throw new Error('Không tìm thấy gói dụng cụ');

    const before = { ...stLog };
    kit.waitingSterilizationQuantity -= stLog.quantity;
    kit.sterilizingQuantity += stLog.quantity;
    await kitRepo.save(kit);

    stLog.status = 'Processing';
    const saved = await stRepo.save(stLog);

    await recordAudit({
      manager,
      user: actor,
      action: 'UPDATE',
      entityType: 'sterilization_log',
      entityId: logId,
      beforeState: before,
      afterState: saved,
      details: `Bắt đầu tiệt trùng ${stLog.quantity} gói ${kit.name}`,
    });
    return saved;
  });
}

export async function completeSterilization(logId: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const stRepo = manager.getRepository(SterilizationLog);
    const kitRepo = manager.getRepository(ToolKit);
    const formRepo = manager.getRepository(BorrowForm);

    const stLog = await stRepo.findOne({ where: { id: logId } });
    if (!stLog) throw new Error('Không tìm thấy bản ghi tiệt trùng');
    if (stLog.status !== 'Processing') throw new Error('Bản ghi không ở trạng thái đang tiệt trùng');

    const kit = await kitRepo.findOne({ where: { id: stLog.packageId }, lock: { mode: 'pessimistic_write' } });
    if (!kit) throw new Error('Không tìm thấy gói dụng cụ');

    const before = { ...stLog };
    kit.sterilizingQuantity -= stLog.quantity;
    kit.inStockQuantity += stLog.quantity;
    await kitRepo.save(kit);

    stLog.status = 'Completed';
    stLog.sterilizedBy = actor.fullName;
    stLog.sterilizedDate = new Date();
    const saved = await stRepo.save(stLog);

    // Khi tất cả bản ghi tiệt trùng của phiếu mượn đã hoàn tất, phiếu tự chuyển Completed.
    const relatedLogs = await stRepo.find({ where: { borrowSlipId: stLog.borrowSlipId } });
    if (relatedLogs.every((l) => l.status === 'Completed')) {
      await formRepo.update({ id: stLog.borrowSlipId }, { status: 'Completed' });
    }

    await recordAudit({
      manager,
      user: actor,
      action: 'UPDATE',
      entityType: 'sterilization_log',
      entityId: logId,
      beforeState: before,
      afterState: saved,
      details: `Hoàn tất tiệt trùng ${stLog.quantity} gói ${kit.name}`,
    });
    return saved;
  });
}
