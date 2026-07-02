import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as sterilizationController from '../controllers/sterilization.controller';

export const sterilizationRouter = Router();

// Đọc không giới hạn theo role bổ sung — Dashboard (kể cả role viewer) cần dữ liệu này để vẽ biểu đồ.
sterilizationRouter.get('/', asyncHandler(sterilizationController.list));
sterilizationRouter.post('/:id/start', requireRole(...ROLE_GROUPS.operational), asyncHandler(sterilizationController.start));
sterilizationRouter.post('/:id/complete', requireRole(...ROLE_GROUPS.operational), asyncHandler(sterilizationController.complete));
