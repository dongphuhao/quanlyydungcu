
import { MedicalTool, ToolStatus, ToolKit, BorrowForm, Department, ToolCategory, User } from '../types';

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', code: 'KNTQ', name: 'Khoa Ngoại Tổng Quát' },
  { id: 'd2', code: 'KCHH', name: 'Khoa Chỉnh Hình' },
  { id: 'd3', code: 'KGMHS', name: 'Khoa Gây Mê Hồi Sức' },
  { id: 'd4', code: 'KPS', name: 'Khoa Phụ Sản' },
];

export const MOCK_CATEGORIES: ToolCategory[] = [
  { id: 'c1', name: 'Dao mổ' },
  { id: 'c2', name: 'Kéo' },
  { id: 'c3', name: 'Panh' },
  { id: 'c4', name: 'Kẹp kim' },
  { id: 'c5', name: 'Ống hút' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', fullName: 'Administrator', role: 'admin', email: 'admin@hospital.com' },
  { id: 'u2', username: 'manager', fullName: 'Phạm Thị B', role: 'manager', email: 'manager@hospital.com' },
  { id: 'u3', username: 'requester', fullName: 'Lê Văn C', role: 'requester', email: 'requester@hospital.com', department: 'Khoa Ngoại Tổng Quát' },
  { id: 'u4', username: 'viewer', fullName: 'Trần Văn D', role: 'viewer', email: 'viewer@hospital.com' },
];

export const MOCK_TOOLS: MedicalTool[] = [
  { id: '1', code: 'DC001', name: 'Dao mổ số 10', type: 'Dao mổ', unit: 'Cái', totalQuantity: 50, availableQuantity: 42, status: ToolStatus.Good, entryDate: '2023-10-01' },
  { id: '2', code: 'DC002', name: 'Kéo Metzenbaum', type: 'Kéo', unit: 'Cái', totalQuantity: 30, availableQuantity: 25, status: ToolStatus.Good, entryDate: '2023-10-05' },
  { id: '3', code: 'DC003', name: 'Panh cầm máu thẳng', type: 'Panh', unit: 'Cái', totalQuantity: 100, availableQuantity: 88, status: ToolStatus.Good, entryDate: '2023-09-20' },
  { id: '4', code: 'DC004', name: 'Kẹp kim Mayo-Hegar', type: 'Kẹp kim', unit: 'Cái', totalQuantity: 20, availableQuantity: 15, status: ToolStatus.Good, entryDate: '2023-11-12' },
  { id: '5', code: 'DC005', name: 'Ống hút Frazier', type: 'Ống hút', unit: 'Cái', totalQuantity: 15, availableQuantity: 12, status: ToolStatus.Good, entryDate: '2023-12-01' },
];

export const MOCK_KITS: ToolKit[] = [
  {
    id: 'k1',
    code: 'SET001',
    name: 'Gói mổ ruột thừa',
    type: 'Tiểu phẫu',
    items: [
      { toolId: '1', quantity: 2 },
      { toolId: '2', quantity: 1 },
      { toolId: '3', quantity: 4 },
    ],
    totalQuantity: 20,
    inStockQuantity: 10,
    borrowedQuantity: 6,
    waitingSterilizationQuantity: 4,
    sterilizingQuantity: 0,
    damagedQuantity: 0,
    liquidatedQuantity: 0,
  },
  {
    id: 'k2',
    code: 'SET002',
    name: 'Gói mổ chỉnh hình',
    type: 'Chỉnh hình',
    items: [
      { toolId: '1', quantity: 1 },
      { toolId: '4', quantity: 2 },
    ],
    totalQuantity: 15,
    inStockQuantity: 12,
    borrowedQuantity: 3,
    waitingSterilizationQuantity: 0,
    sterilizingQuantity: 0,
    damagedQuantity: 0,
    liquidatedQuantity: 0,
  }
];

export const MOCK_BORROWS: BorrowForm[] = [
  {
    id: 'B001',
    borrower: 'Nguyễn Văn A',
    department: 'Khoa Ngoại Tổng Quát',
    requestDate: '2024-05-20T07:30:00',
    borrowDate: '2024-05-20T08:00:00',
    items: [
      { type: 'kit', id: 'k1', name: 'Gói mổ ruột thừa', quantity: 1 }
    ],
    status: 'Active'
  }
];
