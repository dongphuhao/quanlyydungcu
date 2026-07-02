import { Request, Response } from 'express';
import * as sterilizationService from '../services/sterilization.service';

export async function list(req: Request, res: Response) {
  res.json(await sterilizationService.listSterilizationLogs());
}

export async function start(req: Request, res: Response) {
  res.json(await sterilizationService.startSterilization(req.params.id, req.currentUser!));
}

export async function complete(req: Request, res: Response) {
  res.json(await sterilizationService.completeSterilization(req.params.id, req.currentUser!));
}
