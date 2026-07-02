import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { AppDataSource } from '../config/data-source';
import { initTestDb, truncateAll, closeTestDb } from '../test/dbTestUtils';
import { Department, MedicalTool, ToolKit, KitItem, User, ToolStatus, AuditLog, SterilizationLog, BorrowForm } from '../entities';
import { hashPassword } from './auth.service';
import * as borrowService from './borrow.service';
import * as sterilizationService from './sterilization.service';

let actor: User;
let kit: ToolKit;

beforeAll(async () => {
  await initTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await truncateAll();

  const deptRepo = AppDataSource.getRepository(Department);
  const dept = await deptRepo.save(deptRepo.create({ code: 'TST', name: 'Khoa Test' }));

  const userRepo = AppDataSource.getRepository(User);
  actor = await userRepo.save(
    userRepo.create({ username: 'tester', fullName: 'Người test', role: 'admin', email: 't@test.com', passwordHash: await hashPassword('x') })
  );

  const toolRepo = AppDataSource.getRepository(MedicalTool);
  const tool = await toolRepo.save(
    toolRepo.create({ code: 'T1', name: 'Dao test', type: 'Dao mổ', unit: 'Cái', totalQuantity: 10, availableQuantity: 10, status: ToolStatus.Good, entryDate: '2024-01-01' })
  );

  const kitRepo = AppDataSource.getRepository(ToolKit);
  kit = await kitRepo.save(
    kitRepo.create({
      code: 'K1',
      name: 'Gói test',
      type: 'Test',
      totalQuantity: 5,
      inStockQuantity: 5,
      borrowedQuantity: 0,
      waitingSterilizationQuantity: 0,
      sterilizingQuantity: 0,
      damagedQuantity: 0,
      liquidatedQuantity: 0,
      items: [Object.assign(new KitItem(), { toolId: tool.id, quantity: 1 })],
    })
  );

  // Dùng lại tên khoa phòng "Khoa Test" cho borrower.department để id phiếu sinh theo mã TST.
  void dept;
});

describe('borrow state machine — bất biến số lượng', () => {
  it('approveBorrow trừ đúng tồn kho và cộng đang mượn', async () => {
    const form = await borrowService.requestBorrow(
      { borrower: 'Nguyễn Văn A', department: 'Khoa Test', items: [{ id: kit.id, quantity: 2, name: kit.name }] },
      actor
    );
    expect(form.id).toMatch(/^TST\d{6}$/);

    await borrowService.approveBorrow(form.id, actor);

    const kitRepo = AppDataSource.getRepository(ToolKit);
    const updated = await kitRepo.findOneByOrFail({ id: kit.id });
    expect(updated.inStockQuantity).toBe(3);
    expect(updated.borrowedQuantity).toBe(2);
  });

  it('approveBorrow throw và không đổi tồn kho khi thiếu số lượng', async () => {
    const form = await borrowService.requestBorrow(
      { borrower: 'Nguyễn Văn A', department: 'Khoa Test', items: [{ id: kit.id, quantity: 999, name: kit.name }] },
      actor
    );

    await expect(borrowService.approveBorrow(form.id, actor)).rejects.toThrow(/không đủ số lượng/);

    const kitRepo = AppDataSource.getRepository(ToolKit);
    const unchanged = await kitRepo.findOneByOrFail({ id: kit.id });
    expect(unchanged.inStockQuantity).toBe(5);
    expect(unchanged.borrowedQuantity).toBe(0);
  });

  it('chu trình đầy đủ Requested→Active→ReturnRequested→Sterilizing→Completed giữ đúng tổng số lượng', async () => {
    const totalBefore = kit.totalQuantity;

    const form = await borrowService.requestBorrow(
      { borrower: 'Nguyễn Văn A', department: 'Khoa Test', items: [{ id: kit.id, quantity: 2, name: kit.name }] },
      actor
    );
    await borrowService.approveBorrow(form.id, actor);
    await borrowService.requestReturn(form.id, actor);
    await borrowService.approveReturn(form.id, actor);

    const kitRepo = AppDataSource.getRepository(ToolKit);
    const stRepo = AppDataSource.getRepository(AuditLog);
    let current = await kitRepo.findOneByOrFail({ id: kit.id });
    expect(current.waitingSterilizationQuantity).toBe(2);
    const total1 = current.inStockQuantity + current.borrowedQuantity + current.waitingSterilizationQuantity + current.sterilizingQuantity;
    expect(total1).toBe(totalBefore);

    const stLogs = await AppDataSource.getRepository(SterilizationLog).find({ where: { borrowSlipId: form.id } });
    for (const log of stLogs) {
      await sterilizationService.startSterilization(log.id, actor);
      await sterilizationService.completeSterilization(log.id, actor);
    }

    current = await kitRepo.findOneByOrFail({ id: kit.id });
    expect(current.inStockQuantity).toBe(5);
    expect(current.borrowedQuantity).toBe(0);
    expect(current.waitingSterilizationQuantity).toBe(0);
    expect(current.sterilizingQuantity).toBe(0);
    const total2 = current.inStockQuantity + current.borrowedQuantity + current.waitingSterilizationQuantity + current.sterilizingQuantity;
    expect(total2).toBe(totalBefore);

    const formRepo = AppDataSource.getRepository(BorrowForm);
    const finalForm = await formRepo.findOneByOrFail({ id: form.id });
    expect(finalForm.status).toBe('Completed');

    // Audit log phải ghi nhận đủ chuỗi hành động cho phiếu này (INSERT, APPROVE x2, ...)
    const logs = await stRepo.find({ where: { entityId: form.id } });
    const actions = logs.map((l) => l.action);
    expect(actions).toContain('INSERT');
    expect(actions).toContain('APPROVE');
  });
});
