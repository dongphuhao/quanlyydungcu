import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as kitsController from '../controllers/kits.controller';

export const kitsRouter = Router();

kitsRouter.get('/', asyncHandler(kitsController.list));
kitsRouter.post('/', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(kitsController.create));
kitsRouter.put('/:id', requireRole(...ROLE_GROUPS.operational), asyncHandler(kitsController.update));
