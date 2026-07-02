import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as toolsController from '../controllers/tools.controller';

export const toolsRouter = Router();

toolsRouter.get('/', asyncHandler(toolsController.list));
toolsRouter.post('/', requireRole(...ROLE_GROUPS.operational), asyncHandler(toolsController.create));
toolsRouter.put('/:id', requireRole(...ROLE_GROUPS.operational), asyncHandler(toolsController.update));
toolsRouter.post('/:id/adjust-stock', requireRole(...ROLE_GROUPS.operational), asyncHandler(toolsController.adjustStock));
toolsRouter.post('/:id/liquidate', requireRole(...ROLE_GROUPS.operational), asyncHandler(toolsController.liquidate));
