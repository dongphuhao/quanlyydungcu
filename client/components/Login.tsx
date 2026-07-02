
import React, { useState } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface LoginProps {
  onLogin: (res: { user: User; allowedTabs: string[] }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.login(username, password);
      onLogin(res);
    } catch (err: any) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Y DỤNG CỤ</h1>
          <p className="text-blue-100 text-sm mt-1">Hệ thống quản lý y dụng cụ đồ vải</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 animate-fade-in">
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
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-blue-200 disabled:opacity-60"
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider mb-2">Tài khoản demo</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['admin/admin', 'manager/123', 'requester/123', 'viewer/viewer'].map(hint => (
                <span key={hint} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-mono text-gray-500">
                  {hint}
                </span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
