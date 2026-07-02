
import React from 'react';
import { ICONS } from '../constants';
import { User, Role } from '../types';

interface SidebarItemProps {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
  badge?: number;
  onClick: (id: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ id, icon: Icon, label, active, badge, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    <div className="flex items-center space-x-3">
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
  user: User;
  onLogout: () => void;
  pendingApprovalsCount?: number;
}

// Cấu hình tab dựa trên Role
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'departments', 'categories', 'users', 'history', 'reports'],
  manager: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'history', 'reports'],
  requester: ['borrow_request', 'borrow_active', 'history'],
  user: ['borrow_request', 'borrow_active', 'history'],
  viewer: ['dashboard', 'reports']
};

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user, onLogout, pendingApprovalsCount }) => {
  const allowedTabs = ROLE_PERMISSIONS[user.role];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Y Dụng Cụ</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {allowedTabs.includes('dashboard') && (
            <SidebarItem id="dashboard" icon={ICONS.Dashboard} label="Tổng quan" active={activeTab === 'dashboard'} onClick={onTabChange} />
          )}
          {(allowedTabs.includes('tools') || allowedTabs.includes('kits')) && (
            <div className="pt-2 pb-1 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kho dụng cụ</div>
          )}
          {allowedTabs.includes('tools') && (
            <SidebarItem id="tools" icon={ICONS.Tools} label="Dụng cụ y tế" active={activeTab === 'tools'} onClick={onTabChange} />
          )}
          {allowedTabs.includes('kits') && (
            <SidebarItem id="kits" icon={ICONS.Kits} label="Gói dụng cụ" active={activeTab === 'kits'} onClick={onTabChange} />
          )}
          
          <div className="pt-2 pb-1 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mượn & Trả</div>
          {allowedTabs.includes('borrow_request') && (
            <SidebarItem id="borrow_request" icon={ICONS.Borrow} label="Đăng ký mượn" active={activeTab === 'borrow_request'} onClick={onTabChange} />
          )}
          {allowedTabs.includes('borrow_active') && (
            <SidebarItem id="borrow_active" icon={ICONS.History} label="Dụng cụ đang giữ" active={activeTab === 'borrow_active'} onClick={onTabChange} />
          )}
          {allowedTabs.includes('borrow_approvals') && (
            <SidebarItem id="borrow_approvals" icon={ICONS.Borrow} label="Phê duyệt" active={activeTab === 'borrow_approvals'} badge={pendingApprovalsCount} onClick={onTabChange} />
          )}
          
          {(allowedTabs.includes('sterilization') || allowedTabs.includes('liquidation')) && (
            <div className="pt-2 pb-1 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quy trình xử lý</div>
          )}
          {allowedTabs.includes('sterilization') && (
            <SidebarItem id="sterilization" icon={ICONS.History} label="Tiệt trùng" active={activeTab === 'sterilization'} onClick={onTabChange} />
          )}
          {allowedTabs.includes('liquidation') && (
            <SidebarItem id="liquidation" icon={ICONS.Reports} label="Thanh lý/Hư hỏng" active={activeTab === 'liquidation'} onClick={onTabChange} />
          )}

          {user.role === 'admin' && (
            <>
              <div className="pt-2 pb-1 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh mục & Admin</div>
              <SidebarItem id="departments" icon={ICONS.Dashboard} label="Khoa phòng" active={activeTab === 'departments'} onClick={onTabChange} />
              <SidebarItem id="categories" icon={ICONS.Tools} label="Loại dụng cụ" active={activeTab === 'categories'} onClick={onTabChange} />
              <SidebarItem id="users" icon={ICONS.Kits} label="Tài khoản" active={activeTab === 'users'} onClick={onTabChange} />
            </>
          )}

          <div className="pt-2 pb-1 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khác</div>
          {allowedTabs.includes('history') && (
            <SidebarItem id="history" icon={ICONS.History} label="Lịch sử audit" active={activeTab === 'history'} onClick={onTabChange} />
          )}
          {allowedTabs.includes('reports') && (
            <SidebarItem id="reports" icon={ICONS.Reports} label="Báo cáo AI" active={activeTab === 'reports'} onClick={onTabChange} />
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-center space-x-2 p-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-400 font-medium hidden md:block">
              Phòng mổ trung tâm • {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
