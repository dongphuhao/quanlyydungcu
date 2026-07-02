import React from 'react';
import { SterilizationLog, ToolKit, BorrowForm } from '../types';

interface SterilizationListProps {
  logs: SterilizationLog[];
  kits: ToolKit[];
  borrows: BorrowForm[];
  onStart: (logId: string) => void;
  onComplete: (logId: string) => void;
}

const SterilizationList: React.FC<SterilizationListProps> = ({ logs, kits, borrows, onStart, onComplete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Quy trình Tiệt trùng</h3>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã Phiếu Mượn</th>
                <th className="px-6 py-4">Gói Dụng Cụ</th>
                <th className="px-6 py-4">Số lượng</th>
                <th className="px-6 py-4">Ngày bắt đầu</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Chưa có gói nào trong danh sách tiệt trùng.
                  </td>
                </tr>
              ) : (
                logs.slice().reverse().map(log => {
                  const kit = kits.find(k => k.id === log.packageId);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-blue-600">{log.borrowSlipId}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{kit?.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{kit?.code}</p>
                      </td>
                      <td className="px-6 py-4 font-bold">{log.quantity}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(log.startedDate).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'Waiting' && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase">
                            Chờ tiệt trùng
                          </span>
                        )}
                        {log.status === 'Processing' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 uppercase flex items-center w-fit space-x-1">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Đang tiệt trùng</span>
                          </span>
                        )}
                        {log.status === 'Completed' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase">
                            Đã hoàn thành
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'Waiting' && (
                          <button 
                            onClick={() => onStart(log.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 shadow-md"
                          >
                            Bắt đầu
                          </button>
                        )}
                        {log.status === 'Processing' && (
                          <button 
                            onClick={() => onComplete(log.id)}
                            className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700 shadow-md"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SterilizationList;
