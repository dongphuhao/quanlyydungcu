import { Role } from '../entities/enums';

// Nguồn DUY NHẤT cho phân quyền theo tab/role — trước đây bị khai trùng ở App.tsx và Layout.tsx (CLAUDE.md mục 6).
// Frontend không tự khai báo nữa, chỉ đọc allowedTabs trả về từ GET /api/auth/me.
export const TAB_IDS = [
  'dashboard',
  'tools',
  'kits',
  'borrow_request',
  'borrow_approvals',
  'borrow_active',
  'sterilization',
  'liquidation',
  'departments',
  'categories',
  'users',
  'history',
  'reports',
] as const;

export type TabId = (typeof TAB_IDS)[number];

export const ROLE_PERMISSIONS: Record<Role, TabId[]> = {
  admin: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'departments', 'categories', 'users', 'history', 'reports'],
  manager: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'history', 'reports'],
  requester: ['borrow_request', 'borrow_active', 'history'],
  user: ['borrow_request', 'borrow_active', 'history'],
  viewer: ['dashboard', 'reports'],
};

export function getAllowedTabs(role: Role): TabId[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Nhóm role dùng lại nhiều lần trong routes — tránh lặp mảng ['admin','manager'] rải rác khắp middleware.
export const ROLE_GROUPS = {
  fullAdmin: ['admin'] as Role[],
  operational: ['admin', 'manager'] as Role[],
  approvers: ['admin', 'manager'] as Role[],
  requesters: ['admin', 'manager', 'requester', 'user'] as Role[],
  anyAuthenticated: ['admin', 'manager', 'requester', 'user', 'viewer'] as Role[],
};
