
import { MedicalTool, ToolKit, BorrowForm, DatabaseSchema, ToolStatus, SystemLog, User, BorrowStatus, Department, ToolCategory, SterilizationLog, LiquidationLog } from '../types';
import { MOCK_TOOLS, MOCK_KITS, MOCK_BORROWS, MOCK_DEPARTMENTS, MOCK_CATEGORIES, MOCK_USERS } from './mockData';

const DB_KEY = 'surgitrack_db_v3'; // Bumped version

class PersistenceService {
  private data: DatabaseSchema;

  constructor() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = {
          tools: Array.isArray(parsed.tools) ? parsed.tools : MOCK_TOOLS,
          kits: Array.isArray(parsed.kits) ? parsed.kits : MOCK_KITS,
          borrows: Array.isArray(parsed.borrows) ? parsed.borrows : MOCK_BORROWS,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
          departments: Array.isArray(parsed.departments) ? parsed.departments : MOCK_DEPARTMENTS,
          categories: Array.isArray(parsed.categories) ? parsed.categories : MOCK_CATEGORIES,
          users: Array.isArray(parsed.users) ? parsed.users : MOCK_USERS,
          sterilizationLogs: Array.isArray(parsed.sterilizationLogs) ? parsed.sterilizationLogs : [],
          liquidationLogs: Array.isArray(parsed.liquidationLogs) ? parsed.liquidationLogs : [],
        };
      } catch (e) {
        console.error("Failed to parse database, resetting to defaults", e);
        this.data = this.getDefaultData();
      }
    } else {
      this.data = this.getDefaultData();
      this.save();
    }
  }

  private getDefaultData(): DatabaseSchema {
    return {
      tools: MOCK_TOOLS,
      kits: MOCK_KITS,
      borrows: MOCK_BORROWS,
      logs: [],
      departments: MOCK_DEPARTMENTS,
      categories: MOCK_CATEGORIES,
      users: MOCK_USERS,
      sterilizationLogs: [],
      liquidationLogs: [],
    };
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  private addLog(user: User, action: SystemLog['action'], details: string) {
    const log: SystemLog = {
      id: `L-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id || 'system',
      userName: user.fullName || 'Hệ thống',
      action,
      details
    };
    this.data.logs.unshift(log);
    this.save();
  }

  getLogs() { return [...this.data.logs]; }
  getTools() { return [...this.data.tools]; }
  getKits() { return [...this.data.kits]; }
  getBorrows() { return [...this.data.borrows]; }
  getDepartments() { return [...this.data.departments]; }
  getCategories() { return [...this.data.categories]; }
  getUsers() { return [...this.data.users]; }
  getSterilizationLogs() { return [...this.data.sterilizationLogs]; }
  getLiquidationLogs() { return [...this.data.liquidationLogs]; }

  upsertDepartment(dept: Department, user: User) {
    const index = this.data.departments.findIndex(d => d.id === dept.id);
    if (index !== -1) {
      this.data.departments[index] = dept;
      this.addLog(user, 'EDIT', `Sửa khoa phòng: ${dept.name}`);
    } else {
      this.data.departments.push(dept);
      this.addLog(user, 'ADD', `Thêm khoa phòng: ${dept.name}`);
    }
    this.save();
  }

  deleteDepartment(id: string, user: User) {
    this.data.departments = this.data.departments.filter(d => d.id !== id);
    this.addLog(user, 'DELETE', `Xóa khoa phòng ID: ${id}`);
    this.save();
  }

  upsertCategory(cat: ToolCategory, user: User) {
    const index = this.data.categories.findIndex(c => c.id === cat.id);
    if (index !== -1) {
      this.data.categories[index] = cat;
      this.addLog(user, 'EDIT', `Sửa loại dụng cụ: ${cat.name}`);
    } else {
      this.data.categories.push(cat);
      this.addLog(user, 'ADD', `Thêm loại dụng cụ: ${cat.name}`);
    }
    this.save();
  }

  deleteCategory(id: string, user: User) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.addLog(user, 'DELETE', `Xóa loại dụng cụ ID: ${id}`);
    this.save();
  }

  upsertUser(targetUser: User, admin: User) {
    const index = this.data.users.findIndex(u => u.id === targetUser.id);
    if (index !== -1) {
      this.data.users[index] = targetUser;
      this.addLog(admin, 'EDIT', `Sửa tài khoản: ${targetUser.username}`);
    } else {
      this.data.users.push(targetUser);
      this.addLog(admin, 'ADD', `Tạo tài khoản: ${targetUser.username}`);
    }
    this.save();
  }

  deleteUser(id: string, admin: User) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.addLog(admin, 'DELETE', `Xòa tài khoản ID: ${id}`);
    this.save();
  }

  upsertTool(tool: MedicalTool, user: User) {
    const index = this.data.tools.findIndex(t => t.id === tool.id);
    if (index !== -1) {
      this.data.tools[index] = tool;
      this.addLog(user, 'EDIT', `Sửa dụng cụ: ${tool.name}`);
    } else {
      this.data.tools.push(tool);
      this.addLog(user, 'ADD', `Thêm dụng cụ: ${tool.name}`);
    }
    this.save();
  }

  liquidateTool(id: string, q: number, reason: string, notes: string, user: User) {
    const tool = this.data.tools.find(t => t.id === id);
    if (tool && tool.availableQuantity >= q) {
      tool.availableQuantity -= q;
      tool.totalQuantity -= q;
      const log: LiquidationLog = {
        id: `LIQ-${Date.now()}`,
        toolId: id,
        quantity: q,
        reason,
        notes,
        performedBy: user.fullName,
        date: new Date().toISOString()
      };
      this.data.liquidationLogs.push(log);
      this.addLog(user, 'LIQUIDATE', `Thanh lý ${q} dụng cụ ${tool.name}`);
      this.save();
    }
  }

  upsertKit(kit: ToolKit, user: User) {
    const index = this.data.kits.findIndex(k => k.id === kit.id);
    if (index !== -1) {
      this.data.kits[index] = kit;
      this.addLog(user, 'EDIT', `Sửa gói: ${kit.name}`);
    } else {
      this.data.kits.push(kit);
      this.addLog(user, 'ADD', `Tạo gói: ${kit.name}`);
    }
    this.save();
  }

  requestBorrow(form: Omit<BorrowForm, 'id' | 'status' | 'requestDate'>, user: User) {
    const dept = this.data.departments.find(d => d.name === form.department);
    const deptCode = dept ? dept.code : 'GEN';
    const deptBorrows = this.data.borrows.filter(b => b.id.startsWith(deptCode));
    let nextNum = 1;
    if (deptBorrows.length > 0) {
      const nums = deptBorrows.map(b => parseInt(b.id.slice(deptCode.length), 10) || 0);
      nextNum = Math.max(...nums) + 1;
    }
    const newId = `${deptCode}${nextNum.toString().padStart(6, '0')}`;
    const newForm: BorrowForm = {
      ...form,
      id: newId,
      status: 'Requested',
      requestDate: new Date().toISOString()
    };
    this.data.borrows.push(newForm);
    this.addLog(user, 'BORROW', `Gửi yêu cầu mượn ${newId}`);
    this.save();
    return newId;
  }

  approveBorrow(id: string, admin: User) {
    const borrow = this.data.borrows.find(b => b.id === id);
    if (borrow && borrow.status === 'Requested') {
      for (const item of borrow.items) {
        const kit = this.data.kits.find(k => k.id === item.id);
        if (!kit || kit.inStockQuantity < item.quantity) {
          throw new Error(`Gói ${kit?.name || item.id} không đủ số lượng trong kho`);
        }
        kit.inStockQuantity -= item.quantity;
        kit.borrowedQuantity += item.quantity;
      }
      borrow.status = 'Active';
      borrow.borrowDate = new Date().toISOString();
      borrow.approvedBy = admin.fullName;
      this.addLog(admin, 'APPROVE', `Duyệt mượn phiếu ${id}`);
      this.save();
    }
  }

  requestReturn(id: string, user: User) {
    const borrow = this.data.borrows.find(b => b.id === id);
    if (borrow && borrow.status === 'Active') {
      borrow.status = 'ReturnRequested';
      this.addLog(user, 'RETURN', `Gửi yêu cầu trả phiếu ${id}`);
      this.save();
    }
  }

  approveReturn(id: string, admin: User) {
    const borrow = this.data.borrows.find(b => b.id === id);
    if (borrow && borrow.status === 'ReturnRequested') {
      for (const item of borrow.items) {
        const kit = this.data.kits.find(k => k.id === item.id);
        if (kit) {
          kit.borrowedQuantity -= item.quantity;
          kit.waitingSterilizationQuantity += item.quantity;
          // Create sterilization log
          const stLog: SterilizationLog = {
            id: `ST-${Date.now()}-${item.id}`,
            borrowSlipId: id,
            packageId: item.id,
            quantity: item.quantity,
            sterilizedBy: '',
            startedDate: new Date().toISOString(),
            status: 'Waiting'
          };
          this.data.sterilizationLogs.push(stLog);
        }
      }
      borrow.status = 'Sterilizing';
      borrow.returnDate = new Date().toISOString();
      this.addLog(admin, 'APPROVE', `Xác nhận trả phiếu ${id}, chuyển tiệt trùng`);
      this.save();
    }
  }

  startSterilization(logId: string, user: User) {
    const stLog = this.data.sterilizationLogs.find(l => l.id === logId);
    if (stLog && stLog.status === 'Waiting') {
      const kit = this.data.kits.find(k => k.id === stLog.packageId);
      if (kit) {
        kit.waitingSterilizationQuantity -= stLog.quantity;
        kit.sterilizingQuantity += stLog.quantity;
        stLog.status = 'Processing';
        this.addLog(user, 'STERILIZE', `Bắt đầu tiệt trùng ${stLog.quantity} gói ${kit.name}`);
        this.save();
      }
    }
  }

  completeSterilization(logId: string, user: User) {
    const stLog = this.data.sterilizationLogs.find(l => l.id === logId);
    if (stLog && stLog.status === 'Processing') {
      const kit = this.data.kits.find(k => k.id === stLog.packageId);
      if (kit) {
        kit.sterilizingQuantity -= stLog.quantity;
        kit.inStockQuantity += stLog.quantity;
        stLog.status = 'Completed';
        stLog.sterilizedBy = user.fullName;
        stLog.sterilizedDate = new Date().toISOString();
        
        // Check if all items in the borrow slip are sterilized
        const borrowSlipId = stLog.borrowSlipId;
        const relatedLogs = this.data.sterilizationLogs.filter(l => l.borrowSlipId === borrowSlipId);
        if (relatedLogs.every(l => l.status === 'Completed')) {
          const borrow = this.data.borrows.find(b => b.id === borrowSlipId);
          if (borrow) borrow.status = 'Completed';
        }

        this.addLog(user, 'STERILIZE', `Hoàn tất tiệt trùng ${stLog.quantity} gói ${kit.name}`);
        this.save();
      }
    }
  }

  adjustStock(id: string, amount: number, user: User) {
    const tool = this.data.tools.find(t => t.id === id);
    if (!tool) throw new Error('Không tìm thấy dụng cụ');
    if (tool.availableQuantity + amount < 0) throw new Error('Số lượng tồn kho không thể âm');
    
    tool.availableQuantity += amount;
    tool.totalQuantity += amount;
    this.addLog(user, 'ADJUST', `${amount > 0 ? 'Nhập thêm' : 'Điều chỉnh giảm'} ${Math.abs(amount)} ${tool.name}`);
    this.save();
  }

  rejectRequest(id: string, admin: User) {
    const borrow = this.data.borrows.find(b => b.id === id);
    if (borrow && (borrow.status === 'Requested' || borrow.status === 'ReturnRequested')) {
      const oldStatus = borrow.status;
      borrow.status = oldStatus === 'Requested' ? 'Rejected' : 'Active';
      this.addLog(admin, 'REJECT', `Từ chối yêu cầu của phiếu ${id}`);
      this.save();
    }
  }
}

export const db = new PersistenceService();
