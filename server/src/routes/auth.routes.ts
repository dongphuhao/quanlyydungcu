import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', asyncHandler(authController.me));
