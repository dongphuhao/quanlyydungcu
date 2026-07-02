
import React, { useState } from 'react';
import { Department, ToolCategory, User } from '../types';
import { db } from '../services/persistence';

interface CategoryManagementProps {
  type: 'departments' | 'categories';
  data: any[];
  currentUser: User;
  onRefresh: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ type, data, currentUser, onRefresh }) => {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (type === 'departments') {
      const dept: Department = {
        id: editingItem?.id || `dept-${Date.now()}`,
        name: formData.get('name') as string,
        code: formData.get('code') as string,
      };
      db.upsertDepartment(dept, currentUser);
    } else {
      const cat: ToolCategory = {
        id: editingItem?.id || `cat-${Date.now()}`,
        name: formData.get('name') as string,
      };
      db.upsertCategory(cat, currentUser);
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      if (type === 'departments') {
        db.deleteDepartment(id, currentUser);
      } else {
        db.deleteCategory(id, currentUser);
      }
      onRefresh();
    }
  };

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
          <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
            <tr>
              <th className="px-6 py-4">Tên</th>
              {type === 'departments' && <th className="px-6 py-4">Mã</th>}
              <th className="px-6 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                {type === 'departments' && <td className="px-6 py-4 font-mono text-xs">{item.code}</td>}
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'} {type === 'departments' ? 'khoa phòng' : 'loại dụng cụ'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
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
