
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MedicalTool, BorrowForm, ToolKit, SterilizationLog, LiquidationLog } from '../types';
import EmptyState from './EmptyState';

interface DashboardProps {
  tools: MedicalTool[];
  borrows: BorrowForm[];
  kits: ToolKit[];
  sterilizationLogs: SterilizationLog[];
  liquidationLogs: LiquidationLog[];
}

// Palette đã kiểm tra qua skill dataviz (validate_palette.js) — an toàn cho người mù màu,
// đủ tương phản khi có nhãn trực tiếp (legend/tooltip) đi kèm. Xám dành riêng cho trạng thái trung tính "đã thanh lý".
const CHART_COLORS = { inStock: '#2a78d6', borrowed: '#1baf7a', waiting: '#eda100', damaged: '#e34948', liquidated: '#94a3b8' };
const COLORS = [CHART_COLORS.inStock, CHART_COLORS.borrowed, CHART_COLORS.waiting, CHART_COLORS.damaged, CHART_COLORS.liquidated];

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 transition-shadow hover:shadow-md">
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ tools, borrows, kits, sterilizationLogs, liquidationLogs }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filterByTime = <T extends { requestDate?: string; timestamp?: string; date?: string; startedDate?: string; sterilizedDate?: string }>(item: T) => {
    const dateStr = item.requestDate || item.timestamp || item.date || item.startedDate || item.sterilizedDate;
    if (!dateStr) return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    if (timeFilter === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return itemDate >= weekAgo;
    }
    if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return itemDate >= monthAgo;
    }
    if (timeFilter === 'custom' && startDate && endDate) {
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    }
    return true;
  };

  const kitStats = useMemo(() => {
    const total = kits.reduce((acc, k) => acc + k.totalQuantity, 0);
    const activeKits = kits.reduce((acc, k) => acc + k.inStockQuantity, 0);
    const borrowedKits = kits.reduce((acc, k) => acc + k.borrowedQuantity, 0);
    const waitingSterilization = kits.reduce((acc, k) => acc + k.waitingSterilizationQuantity, 0);
    const damagedKits = kits.reduce((acc, k) => acc + k.damagedQuantity, 0);
    const liquidatedKits = kits.reduce((acc, k) => acc + k.liquidatedQuantity, 0);
    
    // Formula from user: Tồn khả dụng = Tổng số gói - Đang mượn - Chờ tiệt trùng
    // In our logic, inStockQuantity is already (Total - Borrowed - Waiting - Sterilizing - Damaged - Liquidated)
    // We will keep our inStockQuantity as "Hoạt động" (Available)
    
    return { total, activeKits, borrowedKits, waitingSterilization, damagedKits, liquidatedKits };
  }, [kits]);

  const filteredBorrows = useMemo(() => borrows.filter(filterByTime), [borrows, timeFilter, startDate, endDate]);
  const filteredSterilization = useMemo(() => sterilizationLogs.filter(filterByTime), [sterilizationLogs, timeFilter, startDate, endDate]);
  
  const stats = {
    activeBorrowSlips: filteredBorrows.filter(b => b.status === 'Active').length,
    returnedKits: filteredBorrows.filter(b => b.status === 'Sterilizing' || b.status === 'Completed').reduce((acc, b) => acc + b.items.length, 0),
    damagedTools: liquidationLogs.filter(filterByTime).reduce((acc, l) => acc + l.quantity, 0),
    waitingSterilizationSlips: filteredBorrows.filter(b => b.status === 'ReturnRequested').length
  };

  const kitData = useMemo(() => {
    return kits.slice(0, 5).map(k => ({
      name: k.name,
      'Trong kho': k.inStockQuantity,
      'Đang mượn': k.borrowedQuantity,
      'Chờ tiệt trùng': k.waitingSterilizationQuantity
    }));
  }, [kits]);

  return (
    <div className="space-y-8">
      {/* Time Filter UI */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Thời gian:</span>
          {(['today', 'week', 'month', 'custom'] as TimeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f === 'today' ? 'Hôm nay' : f === 'week' ? '1 Tuần' : f === 'month' ? '1 Tháng' : 'Tùy chọn'}
            </button>
          ))}
        </div>
        
        {timeFilter === 'custom' && (
          <div className="flex items-center space-x-2 animate-in fade-in duration-300">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Tổng số gói dụng cụ" value={kitStats.total} color="bg-blue-600" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-16 0m16 0v10l-8 4-8-4V7" /></svg>} />
        <StatCard label="Gói đang hoạt động" value={kitStats.activeKits} color="bg-blue-500" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Gói đang mượn" value={kitStats.borrowedKits} color="bg-gray-500" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Gói chờ tiệt trùng" value={kitStats.waitingSterilization} color="bg-gray-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.15l-3.083 1.233A2 2 0 00.5 18.415V21a2 2 0 002 2h19a2 2 0 002-2v-2.585a2 2 0 00-1.072-1.788l-3.5-1.4z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số phiếu mượn hoạt động</p>
          <p className="text-2xl font-black text-blue-600">{stats.activeBorrowSlips}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số gói đã trả</p>
          <p className="text-2xl font-black text-gray-700">{stats.returnedKits}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Dụng cụ/Gói hư hỏng</p>
          <p className="text-2xl font-black text-red-600">{kitStats.damagedKits + stats.damagedTools}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số phiếu chờ tiệt trùng</p>
          <p className="text-2xl font-black text-gray-500">{stats.waitingSterilizationSlips}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Tình trạng các gói phổ biến</h3>
          {kitData.length === 0 ? (
            <EmptyState title="Chưa có gói dụng cụ" description="Thiết lập gói dụng cụ để xem biểu đồ tình trạng tại đây." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e0d9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#898781' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#898781' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Trong kho" fill={CHART_COLORS.inStock} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Đang mượn" fill={CHART_COLORS.borrowed} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chờ tiệt trùng" fill={CHART_COLORS.waiting} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Cơ cấu Trạng thái gói</h3>
          {kitStats.total === 0 ? (
            <EmptyState title="Chưa có dữ liệu" description="Cơ cấu trạng thái sẽ hiển thị khi có gói dụng cụ trong kho." />
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Khả dụng', value: kitStats.activeKits },
                        { name: 'Đang mượn', value: kitStats.borrowedKits },
                        { name: 'Chờ tiệt trùng', value: kitStats.waitingSterilization },
                        { name: 'Hư hỏng', value: kitStats.damagedKits },
                        { name: 'Đã thanh lý', value: kitStats.liquidatedKits },
                      ].filter(d => d.value > 0)}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[kitStats.activeKits, kitStats.borrowedKits, kitStats.waitingSterilization, kitStats.damagedKits, kitStats.liquidatedKits].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { name: 'Khả dụng', value: kitStats.activeKits, color: CHART_COLORS.inStock },
                  { name: 'Đang mượn', value: kitStats.borrowedKits, color: CHART_COLORS.borrowed },
                  { name: 'Chờ tiệt trùng', value: kitStats.waitingSterilization, color: CHART_COLORS.waiting },
                  { name: 'Hư hỏng', value: kitStats.damagedKits, color: CHART_COLORS.damaged },
                  { name: 'Đã thanh lý', value: kitStats.liquidatedKits, color: CHART_COLORS.liquidated },
                ].filter(d => d.value > 0).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
