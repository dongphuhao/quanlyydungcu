import { Request, Response } from 'express';
import * as toolService from '../services/tool.service';

export async function list(req: Request, res: Response) {
  res.json(await toolService.listTools());
}

export async function create(req: Request, res: Response) {
  const saved = await toolService.upsertTool({ ...req.body, id: undefined }, req.currentUser!);
  res.status(201).json(saved);
}

export async function update(req: Request, res: Response) {
  const saved = await toolService.upsertTool({ ...req.body, id: req.params.id }, req.currentUser!);
  res.json(saved);
}

export async function adjustStock(req: Request, res: Response) {
  const { amount } = req.body as { amount: number };
  const saved = await toolService.adjustStock(req.params.id, amount, req.currentUser!);
  res.json(saved);
}

export async function liquidate(req: Request, res: Response) {
  const { quantity, reason, notes } = req.body as { quantity: number; reason: string; notes: string };
  const saved = await toolService.liquidateTool(req.params.id, quantity, reason, notes, req.currentUser!);
  res.json(saved);
}
