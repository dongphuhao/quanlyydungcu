import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { BorrowForm, BorrowItem, ToolKit, SterilizationLog, Department, User } from '../entities';
import { recordAudit } from './auditLog.service';

export async function listBorrows() {
  return AppDataSource.getRepository(BorrowForm).find({ order: { requestDate: 'DESC' } });
}

interface RequestBorrowInput {
  borrower: string;
  department: string;
  items: { id: string; quantity: number; name: string }[];
}

async function generateBorrowId(manager: EntityManager, departmentName: string): Promise<string> {
  const deptRepo = manager.getRepository(Department);
  const dept = await deptRepo.findOneBy({ name: departmentName });
  const deptCode = dept?.code ?? 'GEN';

  // Khoá theo mã khoa phòng trong phạm vi transaction để tránh 2 yêu cầu cùng lúc sinh trùng mã phiếu.
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [deptCode]);

  const existing: { id: string }[] = await manager
    .getRepository(BorrowForm)
    .createQueryBuilder('b')
    .select('b.id', 'id')
    .where('b.id LIKE :prefix', { prefix: `${deptCode}%` })
    .getRawMany();

  let nextNum = 1;
  if (existing.length > 0) {
    const nums = existing.map((b) => parseInt(b.id.slice(deptCode.length), 10) || 0);
    nextNum = Math.max(...nums) + 1;
  }
  return `${deptCode}${nextNum.toString().padStart(6, '0')}`;
}

export async function requestBorrow(input: RequestBorrowInput, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const id = await generateBorrowId(manager, input.department);
    const formRepo = manager.getRepository(BorrowForm);
    const itemRepo = manager.getRepository(BorrowItem);

    const form = formRepo.create({
      id,
      borrower: input.borrower,
      department: input.department,
      requestDate: new Date(),
      status: 'Requested',
      items: input.items.map((it) => itemRepo.create({ kitId: it.id, quantity: it.quantity, name: it.name })),
    });
    const saved = await formRepo.save(form);

    await recordAudit({
      manager,
      user: actor,
      action: 'INSERT',
      entityType: 'borrow_form',
      entityId: saved.id,
      afterState: saved,
      details: `Gửi yêu cầu mượn ${saved.id}`,
    });
    return saved;
  });
}

export async function approveBorrow(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const formRepo = manager.getRepository(BorrowForm);
    const kitRepo = manager.getRepository(ToolKit);

    const borrow = await formRepo.findOne({ where: { id } });
    if (!borrow) throw new Error('Không tìm thấy phiếu mượn');
    if (borrow.status !== 'Requested') throw new Error('Phiếu mượn không ở trạng thái chờ duyệt');
    const before = { ...borrow };

    for (const item of borrow.items) {
      const kit = await kitRepo.findOne({ where: { id: item.kitId }, lock: { mode: 'pessimistic_write' } });
      if (!kit || kit.inStockQuantity < item.quantity) {
        throw new Error(`Gói ${kit?.name ?? item.kitId} không đủ số lượng trong kho`);
      }
      kit.inStockQuantity -= item.quantity;
      kit.borrowedQuantity += item.quantity;
      await kitRepo.save(kit);
    }

    borrow.status = 'Active';
    borrow.borrowDate = new Date();
    borrow.approvedBy = actor.fullName;
    const saved = await formRepo.save(borrow);

    await recordAudit({
      manager,
      user: actor,
      action: 'APPROVE',
      entityType: 'borrow_form',
      entityId: id,
      beforeState: before,
      afterState: saved,
      details: `Duyệt mượn phiếu ${id}`,
    });
    return saved;
  });
}

export async function requestReturn(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const formRepo = manager.getRepository(BorrowForm);
    const borrow = await formRepo.findOne({ where: { id } });
    if (!borrow) throw new Error('Không tìm thấy phiếu mượn');
    if (borrow.status !== 'Active') throw new Error('Phiếu mượn không ở trạng thái đang mượn');
    const before = { ...borrow };

    borrow.status = 'ReturnRequested';
    const saved = await formRepo.save(borrow);

    await recordAudit({
      manager,
      user: actor,
      action: 'UPDATE',
      entityType: 'borrow_form',
      entityId: id,
      beforeState: before,
      afterState: saved,
      details: `Gửi yêu cầu trả phiếu ${id}`,
    });
    return saved;
  });
}

export async function approveReturn(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const formRepo = manager.getRepository(BorrowForm);
    const kitRepo = manager.getRepository(ToolKit);
    const stRepo = manager.getRepository(SterilizationLog);

    const borrow = await formRepo.findOne({ where: { id } });
    if (!borrow) throw new Error('Không tìm thấy phiếu mượn');
    if (borrow.status !== 'ReturnRequested') throw new Error('Phiếu mượn không ở trạng thái chờ xác nhận trả');
    const before = { ...borrow };

    for (const item of borrow.items) {
      const kit = await kitRepo.findOne({ where: { id: item.kitId }, lock: { mode: 'pessimistic_write' } });
      if (!kit) continue;
      kit.borrowedQuantity -= item.quantity;
      kit.waitingSterilizationQuantity += item.quantity;
      await kitRepo.save(kit);

      await stRepo.save(
        stRepo.create({
          borrowSlipId: id,
          packageId: item.kitId,
          quantity: item.quantity,
          startedDate: new Date(),
          status: 'Waiting',
        })
      );
    }

    borrow.status = 'Sterilizing';
    borrow.returnDate = new Date();
    const saved = await formRepo.save(borrow);

    await recordAudit({
      manager,
      user: actor,
      action: 'APPROVE',
      entityType: 'borrow_form',
      entityId: id,
      beforeState: before,
      afterState: saved,
      details: `Xác nhận trả phiếu ${id}, chuyển tiệt trùng`,
    });
    return saved;
  });
}

export async function rejectRequest(id: string, actor: User) {
  return AppDataSource.transaction(async (manager) => {
    const formRepo = manager.getRepository(BorrowForm);
    const borrow = await formRepo.findOne({ where: { id } });
    if (!borrow) throw new Error('Không tìm thấy phiếu mượn');
    if (borrow.status !== 'Requested' && borrow.status !== 'ReturnRequested') {
      throw new Error('Chỉ có thể từ chối yêu cầu đang chờ duyệt mượn hoặc chờ xác nhận trả');
    }
    const before = { ...borrow };
    const wasRequested = borrow.status === 'Requested';
    borrow.status = wasRequested ? 'Rejected' : 'Active';
    const saved = await formRepo.save(borrow);

    await recordAudit({
      manager,
      user: actor,
      action: 'REJECT',
      entityType: 'borrow_form',
      entityId: id,
      beforeState: before,
      afterState: saved,
      details: `Từ chối yêu cầu ${wasRequested ? 'mượn' : 'trả'} của phiếu ${id}`,
    });
    return saved;
  });
}
