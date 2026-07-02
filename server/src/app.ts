import 'reflect-metadata';
import express from 'express';
import { sessionMiddleware } from './config/session';
import { loadCurrentUser, requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

import { authRouter } from './routes/auth.routes';
import { toolsRouter } from './routes/tools.routes';
import { kitsRouter } from './routes/kits.routes';
import { departmentsRouter } from './routes/departments.routes';
import { categoriesRouter } from './routes/categories.routes';
import { usersRouter } from './routes/users.routes';
import { borrowsRouter } from './routes/borrows.routes';
import { sterilizationRouter } from './routes/sterilization.routes';
import { liquidationRouter } from './routes/liquidation.routes';
import { auditRouter } from './routes/audit.routes';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(sessionMiddleware);
  app.use(loadCurrentUser);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Auth router: /login công khai, /logout và /me tự kiểm tra req.currentUser bên trong controller.
  app.use('/api/auth', authRouter);

  // Mọi resource nghiệp vụ khác đều bắt buộc đăng nhập — requireRole ở từng route chỉ tinh chỉnh thêm theo role.
  app.use('/api/tools', requireAuth, toolsRouter);
  app.use('/api/kits', requireAuth, kitsRouter);
  app.use('/api/departments', requireAuth, departmentsRouter);
  app.use('/api/categories', requireAuth, categoriesRouter);
  app.use('/api/users', requireAuth, usersRouter);
  app.use('/api/borrows', requireAuth, borrowsRouter);
  app.use('/api/sterilization-logs', requireAuth, sterilizationRouter);
  app.use('/api/liquidation-logs', requireAuth, liquidationRouter);
  app.use('/api/audit-logs', requireAuth, auditRouter);

  app.use(errorHandler);

  return app;
}
