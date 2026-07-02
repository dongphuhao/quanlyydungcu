import { Request, Response } from 'express';
import { listAuditLogs } from '../services/auditLog.service';

export async function list(req: Request, res: Response) {
  res.json(await listAuditLogs());
}
