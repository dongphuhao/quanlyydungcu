
import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { db } from '../services/persistence';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against the database users
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // Passwords for demo/development:
    // admin: admin
    // others: 123, 123456, or password matches username (for safety)
    const isAdmin = user?.role === 'admin';
    const isValidAdmin = isAdmin && password === 'admin';
    const isValidUser = !isAdmin && user && (password === '123' || password === '123456' || password === user.username);

    if (isValidAdmin || isValidUser) {
      onLogin(user!);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold">Y DỤNG CỤ</h1>
          <p className="text-blue-100 text-sm mt-1">Hệ thống quản lý y dụng cụ đồ vải</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Tên đăng nhập</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Đăng nhập
          </button>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <p className="text-xs text-center text-gray-400">
              Gợi ý: admin/admin, user/123, user2/123, viewer/viewer
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
