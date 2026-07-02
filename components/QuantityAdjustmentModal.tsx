
import React, { useState } from 'react';
import { MedicalTool } from '../types';

interface QuantityAdjustmentModalProps {
  tool: MedicalTool;
  mode: 'restock' | 'liquidate';
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const QuantityAdjustmentModal: React.FC<QuantityAdjustmentModalProps> = ({ tool, mode, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<number>(1);
  const isLiquidate = mode === 'liquidate';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Số lượng phải lớn hơn 0');
    if (isLiquidate && amount > tool.availableQuantity) {
      return alert(`Không thể thanh lý nhiều hơn số lượng hiện có (${tool.availableQuantity})`);
    }
    onConfirm(isLiquidate ? -amount : amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className={`p-4 text-white flex justify-between items-center ${isLiquidate ? 'bg-red-600' : 'bg-green-600'}`}>
          <h3 className="font-bold">
            {isLiquidate ? 'Thanh lý dụng cụ' : 'Nhập bổ sung dụng cụ'}
          </h3>
          <button onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Dụng cụ:</p>
            <p className="font-bold text-gray-800">{tool.name} ({tool.code})</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Hiện có (Khả dụng):</p>
            <p className="font-semibold text-blue-600">{tool.availableQuantity} {tool.unit}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng muốn {isLiquidate ? 'thanh lý' : 'nhập thêm'}:
            </label>
            <input 
              type="number"
              min="1"
              max={isLiquidate ? tool.availableQuantity : undefined}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2 text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className={`flex-1 py-2 text-white font-bold rounded-lg transition-colors shadow-md ${
                isLiquidate ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
              }`}
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuantityAdjustmentModal;
