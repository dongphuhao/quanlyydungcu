import { RequestHandler } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, Role } from '../entities';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

// Nạp user hiện tại từ session vào req.currentUser cho mọi request (không chặn nếu chưa đăng nhập — requireAuth mới chặn).
export const loadCurrentUser: RequestHandler = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) return next();
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId }, relations: ['department'] });
  if (user) req.currentUser = user;
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.currentUser) {
    res.status(401).json({ message: 'Chưa đăng nhập' });
    return;
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.currentUser) {
      res.status(401).json({ message: 'Chưa đăng nhập' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
      return;
    }
    next();
  };
}
