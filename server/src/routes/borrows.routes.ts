import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as borrowsController from '../controllers/borrows.controller';

export const borrowsRouter = Router();

borrowsRouter.get('/', asyncHandler(borrowsController.list));
borrowsRouter.post('/', requireRole(...ROLE_GROUPS.requesters), asyncHandler(borrowsController.create));
borrowsRouter.post('/:id/approve', requireRole(...ROLE_GROUPS.approvers), asyncHandler(borrowsController.approve));
borrowsRouter.post('/:id/request-return', requireRole(...ROLE_GROUPS.operational), asyncHandler(borrowsController.requestReturn));
borrowsRouter.post('/:id/approve-return', requireRole(...ROLE_GROUPS.approvers), asyncHandler(borrowsController.approveReturn));
borrowsRouter.post('/:id/reject', requireRole(...ROLE_GROUPS.approvers), asyncHandler(borrowsController.reject));
