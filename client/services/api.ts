
// Thay thế services/persistence.ts (localStorage) — mọi thao tác đọc/ghi đi qua REST API thật.
// Business logic (validate tồn kho, state machine, tính toán số lượng) nằm hoàn toàn ở server;
// file này chỉ gọi HTTP và (khi cần) chuẩn hoá lại hình dạng dữ liệu cho khớp với types.ts hiện có,
// để không phải viết lại JSX ở App.tsx/components/* đã hoàn thiện.
import {
  MedicalTool, ToolKit, KitItem, BorrowForm, BorrowItem, User, AuditLogEntry, AllowedTabsResponse,
  Department, ToolCategory, SterilizationLog, LiquidationLog, Role,
} from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // body không phải JSON hợp lệ — giữ message mặc định
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Chuẩn hoá dữ liệu phiếu mượn: server lưu kitId/name theo dòng borrow_items,
// client (BorrowModal, App.tsx...) đọc theo hình dạng { type: 'kit', id, name, quantity } đã có sẵn.
interface RawBorrowItem { kitId: string; name: string; quantity: number }
interface RawBorrowForm extends Omit<BorrowForm, 'items'> { items: RawBorrowItem[] }

function normalizeBorrowForm(raw: RawBorrowForm): BorrowForm {
  return {
    ...raw,
    items: raw.items.map((it): BorrowItem => ({ type: 'kit', id: it.kitId, name: it.name, quantity: it.quantity })),
  };
}

// --- Auth ---
export async function login(username: string, password: string): Promise<AllowedTabsResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}
export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}
export async function me(): Promise<AllowedTabsResponse | null> {
  try {
    return await request<AllowedTabsResponse>('/auth/me');
  } catch {
    return null;
  }
}

// --- Tools ---
export async function getTools(): Promise<MedicalTool[]> {
  return request('/tools');
}
export async function upsertTool(tool: Partial<MedicalTool> & { id?: string }): Promise<MedicalTool> {
  const { id, ...body } = tool;
  return id ? request(`/tools/${id}`, { method: 'PUT', body: JSON.stringify(body) })
            : request('/tools', { method: 'POST', body: JSON.stringify(body) });
}
export async function adjustStock(id: string, amount: number): Promise<MedicalTool> {
  return request(`/tools/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify({ amount }) });
}
export async function liquidateTool(id: string, quantity: number, reason: string, notes: string): Promise<LiquidationLog> {
  return request(`/tools/${id}/liquidate`, { method: 'POST', body: JSON.stringify({ quantity, reason, notes }) });
}

// --- Kits ---
export async function getKits(): Promise<ToolKit[]> {
  return request('/kits');
}
export async function upsertKit(kit: { id?: string; code: string; name: string; type: string; totalQuantity: number; items: KitItem[] }): Promise<ToolKit> {
  const { id, ...body } = kit;
  return id ? request(`/kits/${id}`, { method: 'PUT', body: JSON.stringify(body) })
            : request('/kits', { method: 'POST', body: JSON.stringify(body) });
}

// --- Departments ---
export async function getDepartments(): Promise<Department[]> {
  return request('/departments');
}
export async function upsertDepartment(dept: { id?: string; code: string; name: string }): Promise<Department> {
  const { id, ...body } = dept;
  return id ? request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(body) })
            : request('/departments', { method: 'POST', body: JSON.stringify(body) });
}
export async function deleteDepartment(id: string): Promise<void> {
  await request(`/departments/${id}`, { method: 'DELETE' });
}

// --- Categories ---
export async function getCategories(): Promise<ToolCategory[]> {
  return request('/categories');
}
export async function upsertCategory(cat: { id?: string; name: string }): Promise<ToolCategory> {
  const { id, ...body } = cat;
  return id ? request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) })
            : request('/categories', { method: 'POST', body: JSON.stringify(body) });
}
export async function deleteCategory(id: string): Promise<void> {
  await request(`/categories/${id}`, { method: 'DELETE' });
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
  return request('/users');
}
export interface UpsertUserPayload {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  departmentId?: string | null;
  password?: string;
}
export async function upsertUser(user: UpsertUserPayload): Promise<User> {
  const { id, ...body } = user;
  return id ? request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) })
            : request('/users', { method: 'POST', body: JSON.stringify(body) });
}
export async function deleteUser(id: string): Promise<void> {
  await request(`/users/${id}`, { method: 'DELETE' });
}

// --- Borrows ---
export async function getBorrows(): Promise<BorrowForm[]> {
  const raw = await request<RawBorrowForm[]>('/borrows');
  return raw.map(normalizeBorrowForm);
}
export async function requestBorrow(borrower: string, department: string, items: BorrowItem[]): Promise<BorrowForm> {
  const raw = await request<RawBorrowForm>('/borrows', {
    method: 'POST',
    body: JSON.stringify({ borrower, department, items: items.map((it) => ({ id: it.id, quantity: it.quantity, name: it.name })) }),
  });
  return normalizeBorrowForm(raw);
}
export async function approveBorrow(id: string): Promise<BorrowForm> {
  return normalizeBorrowForm(await request<RawBorrowForm>(`/borrows/${id}/approve`, { method: 'POST' }));
}
export async function requestReturn(id: string): Promise<BorrowForm> {
  return normalizeBorrowForm(await request<RawBorrowForm>(`/borrows/${id}/request-return`, { method: 'POST' }));
}
export async function approveReturn(id: string): Promise<BorrowForm> {
  return normalizeBorrowForm(await request<RawBorrowForm>(`/borrows/${id}/approve-return`, { method: 'POST' }));
}
export async function rejectRequest(id: string): Promise<BorrowForm> {
  return normalizeBorrowForm(await request<RawBorrowForm>(`/borrows/${id}/reject`, { method: 'POST' }));
}

// --- Sterilization ---
export async function getSterilizationLogs(): Promise<SterilizationLog[]> {
  return request('/sterilization-logs');
}
export async function startSterilization(logId: string): Promise<SterilizationLog> {
  return request(`/sterilization-logs/${logId}/start`, { method: 'POST' });
}
export async function completeSterilization(logId: string): Promise<SterilizationLog> {
  return request(`/sterilization-logs/${logId}/complete`, { method: 'POST' });
}

// --- Liquidation ---
export async function getLiquidationLogs(): Promise<LiquidationLog[]> {
  return request('/liquidation-logs');
}

// --- Audit log (mục "Lịch sử audit") ---
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const raw = await request<Array<{ id: string; createdAt: string; userId: string | null; userName: string; action: AuditLogEntry['action']; entityType: string; details: string; success: boolean }>>('/audit-logs');
  return raw.map((l) => ({
    id: l.id,
    timestamp: l.createdAt,
    userId: l.userId,
    userName: l.userName,
    action: l.action,
    entityType: l.entityType,
    details: l.details,
    success: l.success,
  }));
}
