import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Department, ToolCategory, User, MedicalTool, ToolKit, KitItem, BorrowForm, BorrowItem, ToolStatus } from '../entities';
import { hashPassword } from '../services/auth.service';

// Port trực tiếp từ client/services/mockData.ts — dữ liệu demo cho môi trường dev, không dùng cho production thật.
async function seed() {
  await AppDataSource.initialize();

  const deptRepo = AppDataSource.getRepository(Department);
  const catRepo = AppDataSource.getRepository(ToolCategory);
  const userRepo = AppDataSource.getRepository(User);
  const toolRepo = AppDataSource.getRepository(MedicalTool);
  const kitRepo = AppDataSource.getRepository(ToolKit);
  const borrowRepo = AppDataSource.getRepository(BorrowForm);

  const existingDepts = await deptRepo.count();
  if (existingDepts > 0) {
    console.log('Đã có dữ liệu, bỏ qua seed. Xoá bảng thủ công nếu muốn seed lại.');
    await AppDataSource.destroy();
    return;
  }

  const departments = await deptRepo.save([
    deptRepo.create({ code: 'KNTQ', name: 'Khoa Ngoại Tổng Quát' }),
    deptRepo.create({ code: 'KCHH', name: 'Khoa Chỉnh Hình' }),
    deptRepo.create({ code: 'KGMHS', name: 'Khoa Gây Mê Hồi Sức' }),
    deptRepo.create({ code: 'KPS', name: 'Khoa Phụ Sản' }),
  ]);

  await catRepo.save([
    catRepo.create({ name: 'Dao mổ' }),
    catRepo.create({ name: 'Kéo' }),
    catRepo.create({ name: 'Panh' }),
    catRepo.create({ name: 'Kẹp kim' }),
    catRepo.create({ name: 'Ống hút' }),
  ]);

  const ktnq = departments[0];
  await userRepo.save([
    userRepo.create({ username: 'admin', fullName: 'Administrator', role: 'admin', email: 'admin@hospital.com', passwordHash: await hashPassword('admin') }),
    userRepo.create({ username: 'manager', fullName: 'Phạm Thị B', role: 'manager', email: 'manager@hospital.com', passwordHash: await hashPassword('123') }),
    userRepo.create({ username: 'requester', fullName: 'Lê Văn C', role: 'requester', email: 'requester@hospital.com', departmentId: ktnq.id, passwordHash: await hashPassword('123') }),
    userRepo.create({ username: 'viewer', fullName: 'Trần Văn D', role: 'viewer', email: 'viewer@hospital.com', passwordHash: await hashPassword('viewer') }),
  ]);

  const tools = await toolRepo.save([
    toolRepo.create({ code: 'DC001', name: 'Dao mổ số 10', type: 'Dao mổ', unit: 'Cái', totalQuantity: 50, availableQuantity: 42, status: ToolStatus.Good, entryDate: '2023-10-01' }),
    toolRepo.create({ code: 'DC002', name: 'Kéo Metzenbaum', type: 'Kéo', unit: 'Cái', totalQuantity: 30, availableQuantity: 25, status: ToolStatus.Good, entryDate: '2023-10-05' }),
    toolRepo.create({ code: 'DC003', name: 'Panh cầm máu thẳng', type: 'Panh', unit: 'Cái', totalQuantity: 100, availableQuantity: 88, status: ToolStatus.Good, entryDate: '2023-09-20' }),
    toolRepo.create({ code: 'DC004', name: 'Kẹp kim Mayo-Hegar', type: 'Kẹp kim', unit: 'Cái', totalQuantity: 20, availableQuantity: 15, status: ToolStatus.Good, entryDate: '2023-11-12' }),
    toolRepo.create({ code: 'DC005', name: 'Ống hút Frazier', type: 'Ống hút', unit: 'Cái', totalQuantity: 15, availableQuantity: 12, status: ToolStatus.Good, entryDate: '2023-12-01' }),
  ]);
  const [dao, keo, panh, kepKim] = tools;

  const kits = await kitRepo.save([
    kitRepo.create({
      code: 'SET001',
      name: 'Gói mổ ruột thừa',
      type: 'Tiểu phẫu',
      totalQuantity: 20,
      inStockQuantity: 10,
      borrowedQuantity: 6,
      waitingSterilizationQuantity: 4,
      sterilizingQuantity: 0,
      damagedQuantity: 0,
      liquidatedQuantity: 0,
      items: [
        Object.assign(new KitItem(), { toolId: dao.id, quantity: 2 }),
        Object.assign(new KitItem(), { toolId: keo.id, quantity: 1 }),
        Object.assign(new KitItem(), { toolId: panh.id, quantity: 4 }),
      ],
    }),
    kitRepo.create({
      code: 'SET002',
      name: 'Gói mổ chỉnh hình',
      type: 'Chỉnh hình',
      totalQuantity: 15,
      inStockQuantity: 12,
      borrowedQuantity: 3,
      waitingSterilizationQuantity: 0,
      sterilizingQuantity: 0,
      damagedQuantity: 0,
      liquidatedQuantity: 0,
      items: [
        Object.assign(new KitItem(), { toolId: dao.id, quantity: 1 }),
        Object.assign(new KitItem(), { toolId: kepKim.id, quantity: 2 }),
      ],
    }),
  ]);

  await borrowRepo.save(
    borrowRepo.create({
      id: 'B001',
      borrower: 'Nguyễn Văn A',
      department: 'Khoa Ngoại Tổng Quát',
      requestDate: new Date('2024-05-20T07:30:00'),
      borrowDate: new Date('2024-05-20T08:00:00'),
      status: 'Active',
      items: [Object.assign(new BorrowItem(), { kitId: kits[0].id, name: 'Gói mổ ruột thừa', quantity: 1 })],
    })
  );

  console.log('Seed dữ liệu demo thành công. Tài khoản: admin/admin, manager/123, requester/123, viewer/viewer');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed thất bại:', err);
  process.exit(1);
});
