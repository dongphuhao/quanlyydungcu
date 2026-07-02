import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as auditController from '../controllers/audit.controller';

export const auditRouter = Router();

// Không giới hạn thêm theo role: tab "Lịch sử audit" đã được gate ở allowedTabs theo role
// (requester/user cũng có tab này trong ROLE_PERMISSIONS hiện tại — giữ đúng hành vi cũ).
auditRouter.get('/', asyncHandler(auditController.list));
