
import React, { useState, useEffect } from 'react';
import { MedicalTool, ToolStatus } from '../types';
import { useModalClose } from '../hooks/useModalClose';

interface ToolFormModalProps {
  tool?: MedicalTool | null;
  categories: string[];
  onClose: () => void;
  onSave: (tool: Partial<MedicalTool> & { id?: string }) => void;
}

const ToolFormModal: React.FC<ToolFormModalProps> = ({ tool, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<MedicalTool>>({
    code: '',
    name: '',
    type: categories.length > 0 ? categories[0] : '',
    unit: 'Cái',
    totalQuantity: 0,
    availableQuantity: 0,
    status: ToolStatus.Good,
    note: '',
    entryDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (tool) {
      setFormData(tool);
    } else if (categories.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: categories[0] }));
    }
  }, [tool, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return alert('Vui lòng nhập Mã và Tên dụng cụ');

    // id (khi sửa) và availableQuantity (khi tạo mới) do backend quyết định — không tính toán/sinh ở client.
    onSave({ ...formData, id: tool?.id });
  };

  const { handleBackdropClick } = useModalClose(onClose);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleBackdropClick}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {tool ? 'Chỉnh sửa dụng cụ' : 'Thêm dụng cụ mới'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã dụng cụ *</label>
              <input 
                required
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Ví dụ: DC001" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại dụng cụ</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {categories.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên dụng cụ *</label>
            <input 
              required
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nhập tên chi tiết của dụng cụ" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <input
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="Cái, Bộ, Đôi..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số lượng</label>
              <input
                type="number"
                min="0"
                value={formData.totalQuantity}
                onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="Thông tin thêm về tình trạng, hạn sử dụng..."
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Lưu dữ liệu
          </button>
        </div>
      </form>
    </div>
  );
};

export default ToolFormModal;
