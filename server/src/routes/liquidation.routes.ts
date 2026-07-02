import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as liquidationController from '../controllers/liquidation.controller';

export const liquidationRouter = Router();

// Đọc không giới hạn theo role bổ sung — Dashboard (kể cả role viewer) cần dữ liệu này để vẽ biểu đồ.
liquidationRouter.get('/', asyncHandler(liquidationController.list));
