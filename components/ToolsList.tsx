
import React, { useState } from 'react';
import { MedicalTool, ToolStatus } from '../types';

interface ToolsListProps {
  tools: MedicalTool[];
  categories: string[];
  onAddTool: (tool: Partial<MedicalTool>) => void;
  onEditTool: (tool: MedicalTool) => void;
  onAdjustStock: (tool: MedicalTool, mode: 'restock' | 'liquidate') => void;
}

const ToolsList: React.FC<ToolsListProps> = ({ tools, categories, onAddTool, onEditTool, onAdjustStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredTools = tools.filter(t => 
    (filterType === 'All' || t.type === filterType) &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm dụng cụ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">Tất cả loại</option>
            {categories.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <button 
          onClick={() => onAddTool({})}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Thêm dụng cụ</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Mã</th>
              <th className="px-6 py-4">Tên dụng cụ</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Số lượng (Tổng/Kho)</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Quản lý kho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTools.map(tool => (
              <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-blue-600">{tool.code}</td>
                <td className="px-6 py-4 text-gray-900 font-medium">{tool.name}</td>
                <td className="px-6 py-4 text-gray-500">{tool.type}</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">{tool.totalQuantity}</span>
                  <span className="text-gray-400"> / </span>
                  <span className={`font-semibold ${tool.availableQuantity < 5 ? 'text-red-500' : 'text-green-600'}`}>{tool.availableQuantity}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    tool.status === ToolStatus.Good ? 'bg-green-100 text-green-700' :
                    tool.status === ToolStatus.Damaged ? 'bg-red-100 text-red-700' :
                    tool.status === ToolStatus.Sterilizing ? 'bg-amber-100 text-amber-700' :
                    tool.status === ToolStatus.Liquidated ? 'bg-gray-200 text-gray-600' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {tool.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onEditTool(tool)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa thông tin">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onAdjustStock(tool, 'restock')} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded hover:bg-green-100 transition-colors">
                      + Nhập
                    </button>
                    <button onClick={() => onAdjustStock(tool, 'liquidate')} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded hover:bg-red-100 transition-colors">
                      - Thanh lý
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ToolsList;
