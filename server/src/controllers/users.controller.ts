import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export async function list(req: Request, res: Response) {
  res.json(await userService.listUsers());
}

export async function create(req: Request, res: Response) {
  const saved = await userService.upsertUser({ ...req.body, id: undefined }, req.currentUser!);
  res.status(201).json(saved);
}

export async function update(req: Request, res: Response) {
  const saved = await userService.upsertUser({ ...req.body, id: req.params.id }, req.currentUser!);
  res.json(saved);
}

export async function remove(req: Request, res: Response) {
  await userService.deleteUser(req.params.id, req.currentUser!);
  res.status(204).end();
}
