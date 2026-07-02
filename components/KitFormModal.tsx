
import React, { useState, useEffect } from 'react';
import { ToolKit, MedicalTool, KitItem } from '../types';

interface KitFormModalProps {
  kit?: ToolKit | null;
  tools: MedicalTool[];
  onClose: () => void;
  onSave: (kit: ToolKit) => void;
}

const KitFormModal: React.FC<KitFormModalProps> = ({ kit, tools, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [selectedItems, setSelectedItems] = useState<KitItem[]>([]);
  const [toolSearch, setToolSearch] = useState('');

  useEffect(() => {
    if (kit) {
      setName(kit.name);
      setCode(kit.code);
      setTotalQuantity(kit.totalQuantity);
      setSelectedItems(kit.items);
    }
  }, [kit]);

  const toggleTool = (tool: MedicalTool) => {
    const exists = selectedItems.find(i => i.toolId === tool.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.toolId !== tool.id));
    } else {
      setSelectedItems([...selectedItems, { toolId: tool.id, quantity: 1 }]);
    }
  };

  const updateQuantity = (toolId: string, qty: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.toolId === toolId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return alert('Vui lòng nhập tên và mã gói');
    if (selectedItems.length === 0) return alert('Vui lòng chọn ít nhất một dụng cụ');

    const finalKit: ToolKit = {
      id: kit?.id || `K-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name,
      code,
      type: kit?.type || 'Tiểu phẫu',
      items: selectedItems,
      totalQuantity,
      inStockQuantity: kit ? kit.inStockQuantity : totalQuantity, // Initial value logic
      borrowedQuantity: kit?.borrowedQuantity || 0,
      waitingSterilizationQuantity: kit?.waitingSterilizationQuantity || 0,
      sterilizingQuantity: kit?.sterilizingQuantity || 0,
      damagedQuantity: kit?.damagedQuantity || 0,
      liquidatedQuantity: kit?.liquidatedQuantity || 0
    };
    onSave(finalKit);
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) || 
    t.code.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {kit ? 'Chỉnh sửa gói dụng cụ' : 'Thiết lập gói dụng cụ mới'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-hidden flex flex-col md:flex-row gap-6">
          {/* Left Side: General Info & Tool Selection */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã gói *</label>
                <input 
                  required
                  value={code} 
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  placeholder="SET-001" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên gói *</label>
                <input 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  placeholder="Gói mổ nội soi..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số lượng *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={totalQuantity} 
                  onChange={e => setTotalQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">Chọn dụng cụ vào gói</label>
              <input 
                type="text"
                placeholder="Tìm dụng cụ..."
                className="w-full px-4 py-2 border rounded-lg mb-2 text-sm"
                value={toolSearch}
                onChange={e => setToolSearch(e.target.value)}
              />
              <div className="h-64 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                {filteredTools.map(t => {
                  const isSelected = selectedItems.some(i => i.toolId === t.id);
                  return (
                    <button 
                      key={t.id} 
                      type="button"
                      onClick={() => toggleTool(t)}
                      className={`w-full text-left p-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-white'}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.code} • {t.type}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Kit Items Preview */}
          <div className="w-full md:w-80 bg-gray-50 rounded-xl p-4 flex flex-col border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-wider">Thành phần gói ({selectedItems.length})</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <p className="text-xs font-medium">Chưa có dụng cụ nào</p>
                </div>
              ) : (
                selectedItems.map(item => {
                  const tool = tools.find(t => t.id === item.toolId);
                  return (
                    <div key={item.toolId} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{tool?.name}</p>
                        <button type="button" onClick={() => toggleTool(tool!)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">SL:</span>
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.toolId, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border rounded text-sm text-center font-bold"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Hủy</button>
          <button 
            type="submit"
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            {kit ? 'Cập nhật gói' : 'Tạo gói dụng cụ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KitFormModal;
