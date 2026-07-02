
import React, { useState, useEffect } from 'react';
import { MedicalTool, ToolKit, BorrowItem, User } from '../types';
import { useModalClose } from '../hooks/useModalClose';
import EmptyState from './EmptyState';

interface BorrowModalProps {
  tools: MedicalTool[];
  kits: ToolKit[];
  currentUser: User;
  departments: string[];
  initialItems?: BorrowItem[];
  onClose: () => void;
  onSave: (borrower: string, dept: string, items: BorrowItem[]) => void;
}

const BorrowModal: React.FC<BorrowModalProps> = ({ tools, kits, currentUser, departments, initialItems, onClose, onSave }) => {
  const [borrower, setBorrower] = useState(currentUser.fullName);
  const [dept, setDept] = useState(currentUser.department || (departments.length > 0 ? departments[0] : ''));
  const [selectedItems, setSelectedItems] = useState<BorrowItem[]>(initialItems || []);
  const [search, setSearch] = useState('');

  const filteredKits = kits.filter(k => k.inStockQuantity > 0 && (k.name.toLowerCase().includes(search.toLowerCase()) || k.code.toLowerCase().includes(search.toLowerCase())));

  useEffect(() => {
    if (initialItems) {
      setSelectedItems(initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    if (currentUser.role === 'requester') {
      setBorrower(currentUser.fullName);
      setDept(currentUser.department || (departments.length > 0 ? departments[0] : ''));
    }
  }, [currentUser, departments]);

  const addItem = (id: string) => {
    const exists = selectedItems.find(i => i.id === id);
    if (exists) {
      setSelectedItems(selectedItems.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const kit = kits.find(k => k.id === id);
      setSelectedItems([...selectedItems, { id, type: 'kit', quantity: 1, name: kit?.name || '' }]);
    }
  };

  const removeItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const { handleBackdropClick } = useModalClose(onClose);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Tạo Phiếu Mượn Gói Dụng Cụ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Người mượn</label>
              <input 
                value={borrower} 
                onChange={e => setBorrower(e.target.value)} 
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Họ tên người mượn" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Khoa/Phòng nhận</label>
              <select 
                value={dept} 
                onChange={e => setDept(e.target.value)} 
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">Chọn Gói Dụng Cụ</label>
              <div className="relative mb-2">
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm gói dụng cụ..."
                  className="w-full pl-8 pr-4 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <svg className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="h-56 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                <div className="p-2 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">Gói dụng cụ khả dụng</div>
                {filteredKits.map(k => (
                  <button key={k.id} onClick={() => addItem(k.id)} className="w-full text-left p-3 hover:bg-white flex justify-between group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{k.name}</span>
                      <span className="text-[10px] text-gray-400">Khả dụng: {k.inStockQuantity} / {k.totalQuantity}</span>
                    </div>
                    <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Thêm</span>
                  </button>
                ))}

                {filteredKits.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-xs italic">Không tìm thấy gói nào khả dụng</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex justify-between">
                <span>Gói đã chọn</span>
                {selectedItems.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">{selectedItems.length} gói</span>
                )}
              </label>
              <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-4 bg-white">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      title="Chưa chọn gói nào"
                      description="Chọn gói dụng cụ ở danh sách bên trái để thêm vào phiếu mượn."
                      icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="bg-blue-50/50 p-2 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity} 
                              onChange={e => setSelectedItems(selectedItems.map((it, i) => i === idx ? {...it, quantity: parseInt(e.target.value) || 1} : it))}
                              className="w-10 text-center text-xs border rounded p-1 font-bold bg-white"
                            />
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        <div className="pl-2 border-l-2 border-blue-200 mt-1 space-y-1">
                          {kits.find(k => k.id === item.id)?.items.map((sub, si) => {
                            const tool = tools.find(t => t.id === sub.toolId);
                            return (
                              <div key={si} className="text-[9px] text-gray-500 font-medium flex justify-between">
                                <span>• {tool?.name}</span>
                                <span className="text-gray-400">x{sub.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
          <button
            disabled={!borrower || selectedItems.length === 0}
            onClick={() => onSave(borrower, dept, selectedItems)}
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-[0.98] disabled:active:scale-100 transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20"
          >
            Xác nhận Mượn
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;
