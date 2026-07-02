
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ToolsList from './components/ToolsList';
import BorrowModal from './components/BorrowModal';
import ToolFormModal from './components/ToolFormModal';
import KitFormModal from './components/KitFormModal';
import QuantityAdjustmentModal from './components/QuantityAdjustmentModal';
import SterilizationList from './components/SterilizationList';
import LiquidationModal from './components/LiquidationModal';
import Login from './components/Login';
import CategoryManagement from './components/CategoryManagement';
import UserManagement from './components/UserManagement';
import JsBarcode from 'jsbarcode';
import { MedicalTool, BorrowForm, ToolKit, BorrowItem, User, SystemLog, BorrowStatus, Role, Department, ToolCategory, SterilizationLog, LiquidationLog } from './types';
import { db } from './services/persistence';
import { getInventoryInsights } from './services/geminiService';
import * as XLSX from 'xlsx';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'departments', 'categories', 'users', 'history', 'reports'],
  manager: ['dashboard', 'tools', 'kits', 'borrow_request', 'borrow_approvals', 'borrow_active', 'sterilization', 'liquidation', 'history', 'reports'],
  requester: ['borrow_request', 'borrow_active', 'history'],
  user: ['borrow_request', 'borrow_active', 'history'],
  viewer: ['dashboard', 'reports']
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('surgitrack_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (currentUser) {
      if (currentUser.role === 'requester' || currentUser.role === 'user') return 'borrow_request';
      if (currentUser.role === 'viewer') return 'dashboard';
      return 'dashboard';
    }
    return 'dashboard';
  });

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'holding'>('all');

  const [tools, setTools] = useState<MedicalTool[]>(db.getTools());
  const [borrows, setBorrows] = useState<BorrowForm[]>(db.getBorrows());
  const [kits, setKits] = useState<ToolKit[]>(db.getKits());
  const [logs, setLogs] = useState<SystemLog[]>(db.getLogs());
  const [departments, setDepartments] = useState<Department[]>(db.getDepartments());
  const [categories, setCategories] = useState<ToolCategory[]>(db.getCategories());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [sterilizationLogs, setSterilizationLogs] = useState<SterilizationLog[]>(db.getSterilizationLogs());
  const [liquidationLogs, setLiquidationLogs] = useState<LiquidationLog[]>(db.getLiquidationLogs());
  
  // Filter states
  const [borrowSearch, setBorrowSearch] = useState('');
  const [borrowFilterStatus, setBorrowFilterStatus] = useState<string>('All');
  const [borrowFilterDept, setBorrowFilterDept] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [initialBorrowItems, setInitialBorrowItems] = useState<BorrowItem[]>([]);
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<MedicalTool | null>(null);
  const [showKitModal, setShowKitModal] = useState(false);
  const [editingKit, setEditingKit] = useState<ToolKit | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingTool, setAdjustingTool] = useState<MedicalTool | null>(null);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [liquidatingTool, setLiquidatingTool] = useState<MedicalTool | null>(null);
  const [adjustMode, setAdjustMode] = useState<'restock' | 'liquidate'>('restock');

  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const allowed = ROLE_PERMISSIONS[currentUser.role];
      if (!allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [currentUser]);

  const refreshData = () => {
    setTools(db.getTools());
    setBorrows(db.getBorrows());
    setKits(db.getKits());
    setLogs(db.getLogs());
    setDepartments(db.getDepartments());
    setCategories(db.getCategories());
    setUsers(db.getUsers());
    setSterilizationLogs(db.getSterilizationLogs());
    setLiquidationLogs(db.getLiquidationLogs());
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('surgitrack_session', JSON.stringify(user));
    const allowed = ROLE_PERMISSIONS[user.role];
    setActiveTab(allowed[0]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('surgitrack_session');
  };

  const handleRequestBorrow = (borrower: string, dept: string, items: BorrowItem[]) => {
    if (!currentUser) return;
    db.requestBorrow({ borrower, department: dept, items }, currentUser);
    setShowBorrowModal(false);
    setInitialBorrowItems([]);
    refreshData();
  };

  const handleApproveBorrow = (id: string) => {
    if (!currentUser) return;
    try {
      db.approveBorrow(id, currentUser);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestReturn = (id: string) => {
    if (!currentUser) return;
    db.requestReturn(id, currentUser);
    refreshData();
  };

  const handleApproveReturn = (id: string) => {
    if (!currentUser) return;
    db.approveReturn(id, currentUser);
    refreshData();
  };

  const handleStartSterilization = (logId: string) => {
    if (!currentUser) return;
    db.startSterilization(logId, currentUser);
    refreshData();
  };

  const handleCompleteSterilization = (logId: string) => {
    if (!currentUser) return;
    db.completeSterilization(logId, currentUser);
    refreshData();
  };

  const handleLiquidate = (quantity: number, reason: string, notes: string) => {
    if (!currentUser || !liquidatingTool) return;
    db.liquidateTool(liquidatingTool.id, quantity, reason, notes, currentUser);
    setShowLiquidationModal(false);
    setLiquidatingTool(null);
    refreshData();
  };

  const handleRejectRequest = (id: string) => {
    if (!currentUser) return;
    if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
      db.rejectRequest(id, currentUser);
      refreshData();
    }
  };

  const handlePrintLabel = (borrow: BorrowForm) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate barcode SVG string
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgElement, borrow.id, {
      format: "CODE128",
      width: 2.5, // Increased for 4cm width
      height: 80, // Increased for 3cm height
      displayValue: true, // Show the code below barcode
      fontSize: 20,
      fontOptions: "bold",
      margin: 10
    });
    const barcodeSvg = new XMLSerializer().serializeToString(svgElement);

    printWindow.document.write(`
      <html>
        <head>
          <title>Tem mã vạch - ${borrow.id}</title>
          <style>
            @page { size: 4cm 3cm; margin: 0; }
            body { 
              width: 4cm; 
              height: 3cm; 
              padding: 0;
              margin: 0;
              display: flex; 
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: white;
              overflow: hidden;
              font-family: Arial, sans-serif;
            }
            .barcode-container { 
              width: 100%; 
              display: flex; 
              justify-content: center; 
              align-items: center;
            }
            svg {
              max-width: 3.8cm;
              max-height: 2.8cm;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${barcodeSvg}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const exportToExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    // Process data to make it Excel-friendly
    const processedData = data.map(item => {
      const newItem = { ...item };
      
      // If it's a kit, format the items list nicely
      if (newItem.items && Array.isArray(newItem.items)) {
        newItem.items = newItem.items.map((it: any) => {
          if (it.type === 'kit') {
            const kit = kits.find(k => k.id === it.id);
            const subItems = kit?.items.map(si => {
              const tool = tools.find(t => t.id === si.toolId);
              return `${tool?.name} (x${si.quantity})`;
            }).join(', ');
            return `Gói: ${it.name} (x${it.quantity}) [${subItems}]`;
          }
          return `Dụng cụ: ${it.name} (x${it.quantity})`;
        }).join('; ');
      }
      
      // Format dates
      if (newItem.requestDate) newItem.requestDate = new Date(newItem.requestDate).toLocaleString('vi-VN');
      if (newItem.returnDate) newItem.returnDate = new Date(newItem.returnDate).toLocaleString('vi-VN');
      if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt).toLocaleString('vi-VN');
      if (newItem.updatedAt) newItem.updatedAt = new Date(newItem.updatedAt).toLocaleString('vi-VN');
      if (newItem.timestamp) newItem.timestamp = new Date(newItem.timestamp).toLocaleString('vi-VN');
      if (newItem.date) newItem.date = new Date(newItem.date).toLocaleString('vi-VN');

      return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const pendingCount = useMemo(() => 
    borrows.filter(b => b.status === 'Requested' || b.status === 'ReturnRequested').length, 
  [borrows]);

  const filteredBorrows = useMemo(() => {
    return borrows.filter(b => {
      const matchStatus = borrowFilterStatus === 'All' || b.status === borrowFilterStatus;
      const matchDept = borrowFilterDept === 'All' || b.department === borrowFilterDept;
      
      const reqDate = new Date(b.requestDate);
      const matchStart = !startDate || reqDate >= new Date(startDate);
      const matchEnd = !endDate || reqDate <= new Date(endDate + 'T23:59:59');

      const matchSearch = borrowSearch === '' || 
        b.borrower.toLowerCase().includes(borrowSearch.toLowerCase()) ||
        b.id.toLowerCase().includes(borrowSearch.toLowerCase()) ||
        b.items.some(it => it.name.toLowerCase().includes(borrowSearch.toLowerCase()));
      return matchStatus && matchDept && matchSearch && matchStart && matchEnd;
    }).reverse();
  }, [borrows, borrowFilterStatus, borrowFilterDept, borrowSearch, startDate, endDate]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const text = await getInventoryInsights(tools, borrows);
      setInsights(text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports' && !insights) {
      fetchInsights();
    }
  }, [activeTab]);

  const getStatusBadge = (status: BorrowStatus) => {
    const styles: Record<BorrowStatus, string> = {
      Requested: 'bg-amber-100 text-amber-700 border-amber-200',
      Active: 'bg-blue-100 text-blue-700 border-blue-200',
      ReturnRequested: 'bg-purple-100 text-purple-700 border-purple-200',
      Sterilizing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      Completed: 'bg-teal-100 text-teal-700 border-teal-200',
      Returned: 'bg-green-100 text-green-700 border-green-200',
      Rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels: Record<BorrowStatus, string> = {
      Requested: 'Chờ duyệt mượn',
      Active: 'Đang mượn',
      ReturnRequested: 'Chờ xác nhận trả',
      Sterilizing: 'Đang tiệt trùng',
      Completed: 'Sẵn có trong kho',
      Returned: 'Đã hoàn trả',
      Rejected: 'Đã từ chối'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const renderContent = () => {
    if (currentUser && !ROLE_PERMISSIONS[currentUser.role].includes(activeTab)) {
      return <div className="p-8 text-center text-gray-500">Đang chuyển hướng...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tools={tools} borrows={borrows} kits={kits} sterilizationLogs={sterilizationLogs} liquidationLogs={liquidationLogs} />;
      case 'tools':
        return (
          <div className="space-y-4">
            <div className="flex justify-end space-x-2">
              <button onClick={() => exportToExcel(tools, 'Danh_sach_dung_cu')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-200 hover:bg-green-100">
                Xuất Excel
              </button>
            </div>
              <ToolsList 
                tools={tools} 
                categories={categories.map(c => c.name)}
                onAddTool={() => { setEditingTool(null); setShowToolModal(true); }} 
                onEditTool={(tool) => { setEditingTool(tool); setShowToolModal(true); }} 
                onAdjustStock={(tool, mode) => { 
                  if (mode === 'liquidate') {
                    setLiquidatingTool(tool);
                    setShowLiquidationModal(true);
                  } else {
                    setAdjustingTool(tool); 
                    setAdjustMode(mode); 
                    setShowAdjustModal(true); 
                  }
                }} 
              />
          </div>
        );
      case 'kits':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Quản lý Gói Dụng cụ (Inventory)</h3>
                <p className="text-xs text-gray-500">Quản lý nhập/xuất, tồn kho và tình trạng sử dụng của các gói.</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => exportToExcel(kits, 'Danh_sach_goi_dung_cu')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-200 hover:bg-green-100">
                  Xuất Excel
                </button>
                {currentUser?.role === 'admin' && (
                  <button onClick={() => { setEditingKit(null); setShowKitModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">
                    + Thiết lập gói mới
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map(kit => (
                <div key={kit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                  <div className="p-6 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{kit.name}</h3>
                       <span className="text-[10px] font-mono bg-gray-100 text-gray-400 px-2 py-0.5 rounded uppercase">{kit.code}</span>
                    </div>
                    {/* Status breakdown bar */}
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex mb-2">
                      <div style={{ width: `${(kit.inStockQuantity / kit.totalQuantity) * 100}%` }} className="bg-green-500 h-full" title="Trong kho"></div>
                      <div style={{ width: `${(kit.borrowedQuantity / kit.totalQuantity) * 100}%` }} className="bg-blue-500 h-full" title="Đang mượn"></div>
                      <div style={{ width: `${(kit.waitingSterilizationQuantity / kit.totalQuantity) * 100}%` }} className="bg-orange-500 h-full" title="Chờ tiệt trùng"></div>
                      <div style={{ width: `${(kit.damagedQuantity / kit.totalQuantity) * 100}%` }} className="bg-red-500 h-full" title="Hư hỏng"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                      <div className="flex items-center justify-between"><span className="text-gray-400">Tổng số lượng:</span> <span className="font-bold">{kit.totalQuantity}</span></div>
                      <div className="flex items-center justify-between"><span className="text-green-600">Trong kho:</span> <span className="font-bold text-green-600">{kit.inStockQuantity}</span></div>
                      <div className="flex items-center justify-between"><span className="text-blue-600">Đang mượn:</span> <span className="font-bold text-blue-600">{kit.borrowedQuantity}</span></div>
                      <div className="flex items-center justify-between"><span className="text-orange-600">Tiệt trùng:</span> <span className="font-bold text-orange-600">{kit.waitingSterilizationQuantity}</span></div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-grow space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Thành phần:</p>
                    {kit.items.map(item => {
                      const tool = tools.find(t => t.id === item.toolId);
                      return <div key={item.toolId} className="flex justify-between text-xs text-gray-600 pl-2 border-l-2 border-gray-100"><span>• {tool?.name}</span><span className="font-bold">x{item.quantity}</span></div>
                    })}
                  </div>
                  
                  <div className="p-4 bg-gray-50 flex space-x-2">
                    <button 
                       onClick={() => { setEditingKit(kit); setShowKitModal(true); }}
                       className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Thiết lập
                    </button>
                    <button 
                       onClick={() => {
                        setInitialBorrowItems([{ id: kit.id, type: 'kit', quantity: 1, name: kit.name }]);
                        setShowBorrowModal(true);
                      }} 
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      Mượn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'borrow_request':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold mb-3">Yêu cầu dụng cụ phẫu thuật</h2>
                <p className="text-blue-100 mb-6 text-lg">Hệ thống ghi nhận yêu cầu mượn lẻ hoặc theo gói (Kit) phục vụ các ca mổ. Vui lòng kiểm tra kỹ số lượng trước khi gửi.</p>
                <button 
                  onClick={() => setShowBorrowModal(true)}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold shadow-xl hover:bg-blue-50 transition-all flex items-center space-x-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span>Tạo phiếu yêu cầu mới</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {kits.filter(k => k.inStockQuantity > 0).map(kit => (
                <div key={kit.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors text-lg">{kit.name}</h3>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">#{kit.code}</span>
                  </div>
                  <div className="space-y-2 mb-6 flex-grow">
                    {kit.items.slice(0, 5).map(item => {
                      const tool = tools.find(t => t.id === item.toolId);
                      return <div key={item.toolId} className="flex justify-between text-xs text-gray-500"><span>• {tool?.name}</span><span className="font-bold text-gray-700">x{item.quantity}</span></div>
                    })}
                    {kit.items.length > 5 && <div className="text-[10px] text-gray-400 italic">... và {kit.items.length - 5} dụng cụ khác</div>}
                  </div>
                  <div className="text-xs font-bold text-green-600 mb-4 bg-green-50 px-3 py-2 rounded-lg inline-flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                    <span>Sẵn có trong kho: {kit.inStockQuantity}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setInitialBorrowItems([{ id: kit.id, type: 'kit', quantity: 1, name: kit.name }]);
                      setShowBorrowModal(true);
                    }} 
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>Mượn gói này</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'borrow_active':
        const isRequester = currentUser?.role === 'requester' || currentUser?.role === 'user';
        let myBorrows = isRequester 
          ? filteredBorrows.filter(b => b.borrower === currentUser.fullName)
          : filteredBorrows;
        
        if (isRequester && activeSubTab === 'holding') {
          myBorrows = myBorrows.filter(b => b.status === 'Active');
        }

        return (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold">
                  {currentUser?.role === 'requester' ? 'Giao dịch Mượn/Trả' : 'Danh sách Mượn/Trả hệ thống'}
                </h3>
                {isRequester && (
                  <div className="flex mt-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button 
                      onClick={() => setActiveSubTab('all')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Tất cả yêu cầu
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('holding')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'holding' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Dụng cụ đang giữ
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                 <div className="flex items-center gap-2 bg-white px-3 py-1.5 border rounded-lg">
                    <span className="text-[10px] font-bold text-gray-400">Từ:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs outline-none" />
                    <span className="text-[10px] font-bold text-gray-400">Đến:</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs outline-none" />
                 </div>
                 <button 
                    onClick={() => exportToExcel(myBorrows, activeSubTab === 'holding' ? 'Dung_cu_dang_giu' : 'Lich_su_muon_tra')}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    <span>Xuất Excel</span>
                 </button>
                 <select 
                    value={borrowFilterStatus}
                    onChange={(e) => setBorrowFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Requested">Chờ duyệt mượn</option>
                    <option value="Active">Đang mượn</option>
                    <option value="ReturnRequested">Chờ xác nhận trả</option>
                    <option value="Sterilizing">Đang tiệt trùng</option>
                    <option value="Completed">Đã hoàn tất</option>
                    <option value="Returned">Đã hoàn trả</option>
                    <option value="Rejected">Đã từ chối</option>
                  </select>
                 <select 
                    value={borrowFilterDept}
                    onChange={(e) => setBorrowFilterDept(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">Tất cả khoa phòng</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                 <div className="relative flex-grow md:flex-initial">
                   <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <input 
                      type="text" 
                      placeholder="Tìm kiếm..." 
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      value={borrowSearch}
                      onChange={(e) => setBorrowSearch(e.target.value)}
                    />
                 </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Mã / Ngày yêu cầu</th>
                      <th className="px-6 py-4">Thông tin mượn</th>
                      <th className="px-6 py-4">Nội dung dụng cụ</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myBorrows.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Không tìm thấy yêu cầu mượn nào phù hợp.</td></tr>
                    ) : (
                      myBorrows.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-blue-600">{b.id}</p>
                            <p className="text-[10px] text-gray-400">{new Date(b.requestDate).toLocaleString('vi-VN')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{b.borrower}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black">{b.department}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] space-y-2">
                              {/* Gói dụng cụ */}
                              {b.items.filter(it => it.type === 'kit').length > 0 && (
                                <div>
                                  <div className="text-blue-600 font-black uppercase mb-1">Gói dụng cụ:</div>
                                  {b.items.filter(it => it.type === 'kit').map((it, i) => {
                                    const kit = kits.find(k => k.id === it.id);
                                    return (
                                      <div key={i} className="mb-2 bg-blue-50/50 p-1.5 rounded border border-blue-100">
                                        <div className="font-bold flex justify-between">
                                          <span>• {it.name}</span>
                                          <span className="text-blue-700">x{it.quantity}</span>
                                        </div>
                                        <div className="pl-3 mt-1 border-l border-blue-200 ml-1 space-y-0.5">
                                          {kit?.items.map((sub, si) => {
                                            const tool = tools.find(t => t.id === sub.toolId);
                                            return (
                                              <div key={si} className="text-gray-500 italic">
                                                + {tool?.name} (x{sub.quantity})
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Dụng cụ lẻ */}
                              {b.items.filter(it => it.type === 'tool').length > 0 && (
                                <div className="mt-2">
                                  <div className="text-teal-600 font-black uppercase mb-1">Dụng cụ lẻ:</div>
                                  <div className="space-y-1">
                                    {b.items.filter(it => it.type === 'tool').map((it, i) => (
                                      <div key={i} className="flex justify-between items-center text-gray-700 font-medium p-1 bg-teal-50/30 rounded">
                                        <span>• {it.name}</span>
                                        <span className="font-bold text-teal-700">x{it.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {b.status === 'Active' && currentUser?.role !== 'requester' && currentUser?.role !== 'user' && (
                                <button 
                                  onClick={() => handleRequestReturn(b.id)} 
                                  className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded hover:bg-orange-600 hover:text-white transition-all border border-orange-200 flex items-center space-x-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                                  <span>Hoàn trả</span>
                                </button>
                              )}
                              {b.status === 'Requested' && (currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                                <button 
                                  onClick={() => handleApproveBorrow(b.id)} 
                                  className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded hover:bg-green-600 hover:text-white transition-all border border-green-200"
                                >
                                  Duyệt mượn
                                </button>
                              )}
                              
                              {/* Nút in mã dụng cụ (4x3cm) */}
                              <button 
                                onClick={() => handlePrintLabel(b)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-600 hover:text-white transition-all border border-blue-200 flex items-center space-x-1"
                                title="In mã dụng cụ (4x3cm)"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                <span>In mã</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'borrow_approvals':
        const pendingApprovals = filteredBorrows.filter(b => b.status === 'Requested' || b.status === 'ReturnRequested');
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-xl font-bold">Phê duyệt Yêu cầu</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={borrowFilterDept}
                  onChange={(e) => setBorrowFilterDept(e.target.value)}
                >
                  <option value="All">Tất cả khoa phòng</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Phiếu / Ngày</th>
                      <th className="px-6 py-4">Người yêu cầu</th>
                      <th className="px-6 py-4">Nội dung</th>
                      <th className="px-6 py-4">Loại yêu cầu</th>
                      <th className="px-6 py-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingApprovals.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Hiện không có yêu cầu nào cần phê duyệt.</td></tr>
                    ) : (
                      pendingApprovals.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{b.id}</p>
                            <p className="text-[10px] text-gray-400">{new Date(b.requestDate).toLocaleString('vi-VN')}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">{b.borrower}</td>
                          <td className="px-6 py-4">
                             <div className="text-[10px] text-gray-600">
                              {b.items.filter(it => it.type === 'kit').length > 0 && (
                                <div className="mb-2">
                                  <div className="text-blue-600 font-bold uppercase mb-1">Gói:</div>
                                  {b.items.filter(it => it.type === 'kit').map((it, i) => {
                                    const kit = kits.find(k => k.id === it.id);
                                    return (
                                      <div key={i} className="mb-1 p-1 bg-blue-50 rounded border border-blue-100">
                                        <div className="font-bold">{it.name} (x{it.quantity})</div>
                                        <div className="pl-2 space-y-0.5 border-l border-blue-200">
                                          {kit?.items.map((sub, si) => {
                                             const t = tools.find(x => x.id === sub.toolId);
                                             return <div key={si} className="text-[9px] text-gray-500 italic">+ {t?.name} (x{sub.quantity})</div>
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {b.items.filter(it => it.type === 'tool').length > 0 && (
                                <div>
                                  <div className="text-teal-600 font-bold uppercase mb-1">Lẻ:</div>
                                  {b.items.filter(it => it.type === 'tool').map((it, i) => (
                                    <div key={i} className="flex justify-between font-medium text-gray-700 bg-teal-50 px-1 rounded">• {it.name} <span>x{it.quantity}</span></div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                               b.status === 'Requested' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                             }`}>
                               {b.status === 'Requested' ? 'Mượn' : 'Trả'}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                               {b.status === 'Requested' ? (
                                  <button onClick={() => handleApproveBorrow(b.id)} className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700">Duyệt mượn</button>
                               ) : (
                                  <button onClick={() => handleApproveReturn(b.id)} className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded hover:bg-purple-700">Xác nhận trả</button>
                               )}
                               <button onClick={() => handleRejectRequest(b.id)} className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded hover:bg-red-100">Từ chối</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        );
      case 'sterilization':
        return (
          <SterilizationList 
            logs={sterilizationLogs}
            kits={kits}
            borrows={borrows}
            onStart={handleStartSterilization}
            onComplete={handleCompleteSterilization}
          />
        );
      case 'liquidation':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Lịch sử Thanh lý & Hư hỏng</h3>
              <button 
                onClick={() => exportToExcel(liquidationLogs, 'Lich_su_thanh_ly')}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100 hover:bg-red-100"
              >
                Xuất báo cáo
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
                  <tr><th className="px-6 py-4">Ngày</th><th className="px-6 py-4">Mục thanh lý</th><th className="px-6 py-4">Số lượng</th><th className="px-6 py-4">Lý do</th><th className="px-6 py-4">Người thực hiện</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {liquidationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-red-50/10">
                      <td className="px-6 py-4 text-gray-400">{new Date(log.date).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 font-bold">
                        {log.packageId ? kits.find(k => k.id === log.packageId)?.name : tools.find(t => t.id === log.toolId)?.name}
                      </td>
                      <td className="px-6 py-4 text-red-600 font-bold">{log.quantity}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{log.reason}</p>
                        <p className="text-[10px] text-gray-400">{log.notes}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'departments':
        return <CategoryManagement type="departments" data={departments} currentUser={currentUser!} onRefresh={refreshData} />;
      case 'categories':
        return <CategoryManagement type="categories" data={categories} currentUser={currentUser!} onRefresh={refreshData} />;
      case 'users':
        return <UserManagement users={users} departments={departments.map(d => d.name)} currentUser={currentUser!} onRefresh={refreshData} />;
      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Nhật ký audit hệ thống</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
                  <tr><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">Người dùng</th><th className="px-6 py-4">Hành động</th><th className="px-6 py-4">Chi tiết</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 text-gray-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 font-bold">{log.userName}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black">{log.action}</span></td>
                      <td className="px-6 py-4 text-gray-600">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-xl shadow-blue-50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                  <h3 className="text-2xl font-black text-gray-900">Trung tâm xuất báo cáo Excel</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => exportToExcel(tools, 'Bao_cao_ton_kho_chi_tiet')}>
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-9-9H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H9z" /></svg>
                  </div>
                  <h4 className="font-black text-blue-900 mb-1">Báo cáo tồn kho</h4>
                  <p className="text-xs text-blue-700/70">Xuất danh sách và số lượng chi tiết tất cả dụng cụ lẻ.</p>
                </div>

                <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => exportToExcel(kits, 'Bao_cao_danh_muc_goi')}>
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-16 0m16 0v10l-8 4-8-4V7" /></svg>
                  </div>
                  <h4 className="font-black text-teal-900 mb-1">Danh mục gói dụng cụ</h4>
                  <p className="text-xs text-teal-700/70">Chi tiết các gói dụng cụ và thành phần bên trong.</p>
                </div>

                <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => exportToExcel(borrows, 'Bao_cao_lich_su_muon_tra')}>
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h4 className="font-black text-purple-900 mb-1">Lịch sử mượn trả</h4>
                  <p className="text-xs text-purple-700/70">Toàn bộ nhật ký mượn, trả và trạng thái hiện tại.</p>
                </div>

                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => exportToExcel(sterilizationLogs, 'Bao_cao_tiet_trung')}>
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 className="font-black text-orange-900 mb-1">Báo cáo tiệt trùng</h4>
                  <p className="text-xs text-orange-700/70">Theo dõi thời gian và trạng thái xử lý dụng cụ.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default: return <div className="p-8 text-center text-gray-500">Nội dung không khả dụng.</div>;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onLogout={handleLogout} pendingApprovalsCount={pendingCount}>
      {renderContent()}
      {showBorrowModal && currentUser && (
        <BorrowModal 
          tools={tools} 
          kits={kits} 
          currentUser={currentUser} 
          departments={departments.map(d => d.name)}
          initialItems={initialBorrowItems}
          onClose={() => {
            setShowBorrowModal(false);
            setInitialBorrowItems([]);
          }} 
          onSave={handleRequestBorrow} 
        />
      )}
      {showToolModal && (
        <ToolFormModal 
          tool={editingTool} 
          categories={categories.map(c => c.name)}
          onClose={() => { setShowToolModal(false); setEditingTool(null); }} 
          onSave={(tool) => { db.upsertTool(tool, currentUser!); refreshData(); setShowToolModal(false); }} 
        />
      )}
      {showKitModal && (
        <KitFormModal kit={editingKit} tools={tools} onClose={() => { setShowKitModal(false); setEditingKit(null); }} onSave={(kit) => { db.upsertKit(kit, currentUser!); refreshData(); setShowKitModal(false); }} />
      )}
      {showAdjustModal && adjustingTool && (
        <QuantityAdjustmentModal tool={adjustingTool} mode={adjustMode} onClose={() => setShowAdjustModal(false)} onConfirm={(amount) => { try { db.adjustStock(adjustingTool.id, amount, currentUser!); refreshData(); setShowAdjustModal(false); } catch(e:any){alert(e.message)} }} />
      )}
      {showLiquidationModal && liquidatingTool && (
        <LiquidationModal 
          item={liquidatingTool} 
          type="tool"
          user={currentUser!} 
          onClose={() => { setShowLiquidationModal(false); setLiquidatingTool(null); }} 
          onConfirm={handleLiquidate} 
        />
      )}
    </Layout>
  );
};

export default App;
