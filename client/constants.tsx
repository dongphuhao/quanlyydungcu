
import React from 'react';

export const TOOL_TYPES = ['Dao mổ', 'Kéo', 'Panh', 'Kẹp kim', 'Ống hút', 'Banh vết mổ', 'Khác'];

export const DEPARTMENTS = [
  'Ngoại Tổng Quát',
  'Chấn thương chỉnh hình',
  'Phẫu thuật thần kinh',
  'Gây mê hồi sức',
  'Sản phụ khoa',
  'Tai Mũi Họng',
  'Mắt',
  'Răng Hàm Mặt',
  'Cấp cứu - Phẫu thuật',
  'Tim mạch lồng ngực'
];

// Icon nhỏ dùng riêng cho badge trạng thái (outline, 24x24, theo chuẩn Heroicons)
const StatusIcon = {
  Clock: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Rotate: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Flame: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  Archive: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  X: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

interface BadgeStyle {
  label: string;
  className: string;
  icon: React.ComponentType<any>;
}

// Hệ badge trạng thái dùng chung — chỉ dùng xanh dương/xám/đỏ theo design system (CLAUDE.md mục 7).
// Phân biệt giữa các trạng thái "đang chờ/đang xử lý" chủ yếu bằng icon + label, không bằng hue.
export const BORROW_STATUS_BADGE: Record<string, BadgeStyle> = {
  Requested: { label: 'Chờ duyệt mượn', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Clock },
  Active: { label: 'Đang mượn', className: 'bg-blue-600 text-white border-blue-600', icon: StatusIcon.Check },
  ReturnRequested: { label: 'Chờ xác nhận trả', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Rotate },
  Sterilizing: { label: 'Đang tiệt trùng', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Flame },
  Completed: { label: 'Sẵn có trong kho', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Archive },
  Returned: { label: 'Đã hoàn trả', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Check },
  Rejected: { label: 'Đã từ chối', className: 'bg-red-50 text-red-700 border-red-100', icon: StatusIcon.X },
};

export const STERILIZATION_STATUS_BADGE: Record<string, BadgeStyle> = {
  Waiting: { label: 'Chờ tiệt trùng', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Clock },
  Processing: { label: 'Đang tiệt trùng', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Flame },
  Completed: { label: 'Đã hoàn thành', className: 'bg-blue-600 text-white border-blue-600', icon: StatusIcon.Check },
};

export const TOOL_STATUS_BADGE: Record<string, BadgeStyle> = {
  'Tốt': { label: 'Tốt', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Check },
  'Đang mượn': { label: 'Đang mượn', className: 'bg-blue-600 text-white border-blue-600', icon: StatusIcon.Rotate },
  'Hỏng': { label: 'Hỏng', className: 'bg-red-50 text-red-700 border-red-100', icon: StatusIcon.X },
  'Chờ tiệt trùng': { label: 'Chờ tiệt trùng', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Flame },
  'Đã thanh lý': { label: 'Đã thanh lý', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: StatusIcon.Archive },
};

export const ROLE_BADGE: Record<string, BadgeStyle> = {
  admin: { label: 'Admin', className: 'bg-blue-600 text-white border-blue-600', icon: StatusIcon.Check },
  manager: { label: 'Manager', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: StatusIcon.Check },
  requester: { label: 'Requester', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Clock },
  user: { label: 'User', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: StatusIcon.Clock },
  viewer: { label: 'Viewer', className: 'bg-gray-50 text-gray-500 border-gray-200', icon: StatusIcon.Clock },
};

export const StatusBadge: React.FC<{ map: Record<string, BadgeStyle>; status: string; className?: string }> = ({ map, status, className = '' }) => {
  const style = map[status];
  if (!style) return <span className={`px-2 py-1 rounded-full text-[10px] font-bold border bg-gray-100 text-gray-600 border-gray-200 ${className}`}>{status}</span>;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${style.className} ${className}`}>
      <Icon className="w-3 h-3 shrink-0" />
      {style.label}
    </span>
  );
};

export const ICONS = {
  Dashboard: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Tools: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  Kits: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Borrow: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  History: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Reports: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};
