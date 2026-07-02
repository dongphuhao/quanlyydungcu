import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as departmentsController from '../controllers/departments.controller';

export const departmentsRouter = Router();

departmentsRouter.get('/', asyncHandler(departmentsController.list));
departmentsRouter.post('/', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(departmentsController.create));
departmentsRouter.put('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(departmentsController.update));
departmentsRouter.delete('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(departmentsController.remove));
