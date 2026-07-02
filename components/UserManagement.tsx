
import React, { useState } from 'react';
import { User, Role } from '../types';
import { db } from '../services/persistence';

interface UserManagementProps {
  users: User[];
  departments: string[];
  currentUser: User;
  onRefresh: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, departments, currentUser, onRefresh }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newUser: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      username: formData.get('username') as string,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as Role,
      department: formData.get('department') as string || undefined,
    };
    
    db.upsertUser(newUser, currentUser);
    setIsModalOpen(false);
    setEditingUser(null);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      alert('Bạn không thể xóa tài khoản của chính mình!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      db.deleteUser(id, currentUser);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Quản lý Tài khoản & Phân quyền</h3>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          + Tạo tài khoản
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
            <tr>
              <th className="px-6 py-4">Tài khoản</th>
              <th className="px-6 py-4">Họ tên / Khoa</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.username}</td>
                <td className="px-6 py-4">
                    <p className="font-semibold text-xs">{user.fullName}</p>
                    <p className="text-[10px] text-gray-400">{user.department || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'manager' ? 'bg-amber-100 text-amber-700' :
                    user.role === 'requester' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-bold"
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
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold">
                  {editingUser ? 'Cập nhật' : 'Tạo mới'} tài khoản
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên đăng nhập</label>
                    <input name="username" defaultValue={editingUser?.username} required className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Họ và tên</label>
                    <input name="fullName" defaultValue={editingUser?.fullName} required className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vai trò</label>
                  <select name="role" defaultValue={editingUser?.role || 'requester'} className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="viewer">Viewer (Chỉ xem)</option>
                    <option value="requester">Requester (Tạo yêu cầu)</option>
                    <option value="manager">Manager (Quản lý mượn trả)</option>
                    <option value="admin">Administrator (Toàn quyền)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Khoa phòng</label>
                  <select name="department" defaultValue={editingUser?.department} className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Chọn khoa phòng (tùy chọn)</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                  <input name="email" type="email" defaultValue={editingUser?.email} required className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
