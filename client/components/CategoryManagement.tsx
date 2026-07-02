
import React, { useState } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import EmptyState from './EmptyState';
import { useModalClose } from '../hooks/useModalClose';

interface CategoryManagementProps {
  type: 'departments' | 'categories';
  data: any[];
  currentUser: User;
  onRefresh: () => void | Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ type, data, onRefresh }) => {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      if (type === 'departments') {
        await api.upsertDepartment({ id: editingItem?.id, name: formData.get('name') as string, code: formData.get('code') as string });
      } else {
        await api.upsertCategory({ id: editingItem?.id, name: formData.get('name') as string });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      if (type === 'departments') {
        await api.deleteDepartment(id);
      } else {
        await api.deleteCategory(id);
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const { handleBackdropClick } = useModalClose(() => setIsModalOpen(false), isModalOpen);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">
          {type === 'departments' ? 'Danh mục Khoa phòng' : 'Danh mục Loại dụng cụ'}
        </h3>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          + Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Tên</th>
              {type === 'departments' && <th className="px-6 py-4">Mã</th>}
              <th className="px-6 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr><td colSpan={type === 'departments' ? 3 : 2}><EmptyState title="Chưa có dữ liệu" description="Nhấn “+ Thêm mới” để tạo mục đầu tiên." /></td></tr>
            ) : data.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                {type === 'departments' && <td className="px-6 py-4 font-mono text-xs">{item.code}</td>}
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <form onSubmit={handleSave}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'} {type === 'departments' ? 'khoa phòng' : 'loại dụng cụ'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên</label>
                  <input 
                    name="name" 
                    defaultValue={editingItem?.name} 
                    required 
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {type === 'departments' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mã khoa</label>
                    <input 
                      name="code" 
                      defaultValue={editingItem?.code} 
                      required 
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
