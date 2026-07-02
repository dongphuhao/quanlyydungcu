
export enum ToolStatus {
  Good = 'Tốt',
  Borrowed = 'Đang mượn',
  Damaged = 'Hỏng',
  Sterilizing = 'Chờ tiệt trùng',
  Liquidated = 'Đã thanh lý'
}

export enum KitStatus {
  Available = 'Khả dụng',
  Borrowed = 'Đang mượn',
  WaitingSterilization = 'Chờ tiệt trùng',
  Sterilizing = 'Đang tiệt trùng',
  Damaged = 'Hư hỏng',
  Liquidated = 'Thanh lý'
}

export type Role = 'admin' | 'manager' | 'requester' | 'viewer' | 'user';

export type BorrowStatus = 'Requested' | 'Active' | 'ReturnRequested' | 'Returned' | 'Sterilizing' | 'Completed' | 'Rejected';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  email: string;
  department?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'ADD' | 'EDIT' | 'ADJUST' | 'BORROW' | 'RETURN' | 'APPROVE' | 'REJECT' | 'DELETE' | 'STERILIZE' | 'LIQUIDATE';
  details: string;
}

export interface MedicalTool {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  totalQuantity: number;
  availableQuantity: number;
  status: ToolStatus;
  entryDate: string;
  note?: string;
}

export interface KitItem {
  toolId: string;
  quantity: number;
}

export interface ToolKit {
  id: string;
  code: string;
  name: string;
  type: string; // "Tiểu phẫu", etc.
  items: KitItem[];
  totalQuantity: number;
  inStockQuantity: number;
  borrowedQuantity: number;
  waitingSterilizationQuantity: number;
  sterilizingQuantity: number;
  damagedQuantity: number;
  liquidatedQuantity: number;
}

export interface BorrowItem {
  type: 'kit'; // Restricted to kits only now
  id: string;
  name: string;
  quantity: number;
}

export interface BorrowForm {
  id: string;
  borrower: string;
  department: string;
  requestDate: string;
  borrowDate?: string;
  returnDate?: string;
  items: BorrowItem[];
  status: BorrowStatus;
  approvedBy?: string;
}

export interface SterilizationLog {
  id: string;
  borrowSlipId: string;
  packageId: string;
  quantity: number;
  sterilizedBy: string;
  sterilizedDate?: string;
  startedDate: string;
  status: 'Waiting' | 'Processing' | 'Completed';
}

export interface LiquidationLog {
  id: string;
  packageId?: string;
  toolId?: string;
  quantity: number;
  reason: string;
  notes: string;
  performedBy: string;
  date: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface ToolCategory {
  id: string;
  name: string;
}

export interface DatabaseSchema {
  tools: MedicalTool[];
  kits: ToolKit[];
  borrows: BorrowForm[];
  logs: SystemLog[];
  departments: Department[];
  categories: ToolCategory[];
  users: User[];
  sterilizationLogs: SterilizationLog[];
  liquidationLogs: LiquidationLog[];
}
