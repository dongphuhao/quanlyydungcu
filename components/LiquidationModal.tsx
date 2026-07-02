import React, { useState } from 'react';
import { MedicalTool, ToolKit, User } from '../types';

interface LiquidationModalProps {
  item: MedicalTool;
  type: 'tool';
  user: User;
  onClose: () => void;
  onConfirm: (quantity: number, reason: string, notes: string) => void;
}

const LiquidationModal: React.FC<LiquidationModalProps> = ({ item, user, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Dụng cụ hư hỏng');
  const [notes, setNotes] = useState('');

  const maxQuantity = item.availableQuantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || quantity > maxQuantity) {
      alert('Số lượng không hợp lệ');
      return;
    }
    onConfirm(quantity, reason, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
          <h3 className="text-xl font-bold text-red-700 flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Thanh lý Dụng cụ</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Đối tượng thanh lý</p>
            <p className="font-bold text-gray-800">{item.name}</p>
            <p className="text-xs text-gray-500">Mã: {item.code}</p>
            <p className="text-xs text-blue-600 font-bold mt-1">Khả dụng trong kho: {maxQuantity}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng thanh lý *</label>
            <input 
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do thanh lý *</label>
            <select 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
            >
              <option value="Dụng cụ hư hỏng">Dụng cụ hư hỏng</option>
              <option value="Lỗi kỹ thuật">Lỗi kỹ thuật</option>
              <option value="Hết hạn sử dụng">Hết hạn sử dụng</option>
              <option value="Thất lạc">Thất lạc</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú chi tiết</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              placeholder="Mô tả cụ thể tình trạng..."
            />
          </div>

          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              Xác nhận Thanh lý
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiquidationModal;
