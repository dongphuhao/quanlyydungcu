import { Request, Response } from 'express';
import * as liquidationService from '../services/liquidation.service';

export async function list(req: Request, res: Response) {
  res.json(await liquidationService.listLiquidationLogs());
}
