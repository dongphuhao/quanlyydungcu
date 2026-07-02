import { Request, Response } from 'express';
import * as kitService from '../services/kit.service';

export async function list(req: Request, res: Response) {
  res.json(await kitService.listKits());
}

export async function create(req: Request, res: Response) {
  const saved = await kitService.upsertKit({ ...req.body, id: undefined }, req.currentUser!);
  res.status(201).json(saved);
}

export async function update(req: Request, res: Response) {
  const saved = await kitService.upsertKit({ ...req.body, id: req.params.id }, req.currentUser!);
  res.json(saved);
}
