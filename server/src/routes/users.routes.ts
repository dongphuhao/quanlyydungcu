import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { ROLE_GROUPS } from '../config/permissions';
import * as usersController from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.get('/', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(usersController.list));
usersRouter.post('/', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(usersController.create));
usersRouter.put('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(usersController.update));
usersRouter.delete('/:id', requireRole(...ROLE_GROUPS.fullAdmin), asyncHandler(usersController.remove));
