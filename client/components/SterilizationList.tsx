import React from 'react';
import { SterilizationLog, ToolKit, BorrowForm } from '../types';
import { StatusBadge, STERILIZATION_STATUS_BADGE } from '../constants';
import EmptyState from './EmptyState';

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
            <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
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
                  <td colSpan={6}>
                    <EmptyState title="Chưa có gói nào trong danh sách tiệt trùng" description="Danh sách sẽ xuất hiện khi có phiếu mượn được xác nhận trả." />
                  </td>
                </tr>
              ) : (
                logs.slice().reverse().map(log => {
                  const kit = kits.find(k => k.id === log.packageId);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
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
                        <StatusBadge map={STERILIZATION_STATUS_BADGE} status={log.status} />
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'Waiting' && (
                          <button
                            onClick={() => onStart(log.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                          >
                            Bắt đầu
                          </button>
                        )}
                        {log.status === 'Processing' && (
                          <button
                            onClick={() => onComplete(log.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
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
