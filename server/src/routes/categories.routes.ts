import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as categoriesController from '../controllers/categories.controller';

export const categoriesRouter = Router();

categoriesRouter.get('/', asyncHandler(categoriesController.list));
categoriesRouter.post('/', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(categoriesController.create));
categoriesRouter.put('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(categoriesController.update));
categoriesRouter.delete('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(categoriesController.remove));
