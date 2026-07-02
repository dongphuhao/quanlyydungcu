import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';

export async function list(req: Request, res: Response) {
  res.json(await categoryService.listCategories());
}

export async function create(req: Request, res: Response) {
  const saved = await categoryService.upsertCategory({ ...req.body, id: undefined }, req.currentUser!);
  res.status(201).json(saved);
}

export async function update(req: Request, res: Response) {
  const saved = await categoryService.upsertCategory({ ...req.body, id: req.params.id }, req.currentUser!);
  res.json(saved);
}

export async function remove(req: Request, res: Response) {
  await categoryService.deleteCategory(req.params.id, req.currentUser!);
  res.status(204).end();
}
