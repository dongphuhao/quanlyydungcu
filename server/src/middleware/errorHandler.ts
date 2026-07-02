import { ErrorRequestHandler } from 'express';

// Lỗi nghiệp vụ (throw new Error(...) trong services/) trả về 400 kèm message tiếng Việt gốc,
// để frontend giữ nguyên pattern catch(e) { alert(e.message) } đang có.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
  res.status(400).json({ message });
};
