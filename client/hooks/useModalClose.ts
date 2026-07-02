import { useEffect, MouseEvent } from 'react';

// Đóng modal bằng phím Esc (chỉ lắng nghe khi modal đang mở); click ra ngoài panel xử lý qua handleBackdropClick
export function useModalClose(onClose: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, enabled]);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return { handleBackdropClick };
}
