// Giá trị khớp 1:1 với client/types.ts để payload API không cần tầng dịch riêng.

export type Role = 'admin' | 'manager' | 'requester' | 'viewer' | 'user';
export const ROLES: Role[] = ['admin', 'manager', 'requester', 'viewer', 'user'];

export enum ToolStatus {
  Good = 'Tốt',
  Borrowed = 'Đang mượn',
  Damaged = 'Hỏng',
  Sterilizing = 'Chờ tiệt trùng',
  Liquidated = 'Đã thanh lý',
}

export type BorrowStatus =
  | 'Requested'
  | 'Active'
  | 'ReturnRequested'
  | 'Returned'
  | 'Sterilizing'
  | 'Completed'
  | 'Rejected';

export type SterilizationStatus = 'Waiting' | 'Processing' | 'Completed';

// Đúng 7 giá trị bắt buộc theo CLAUDE.md mục 4 — chi tiết nghiệp vụ nằm ở entityType/details, không mở rộng enum này.
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT';
