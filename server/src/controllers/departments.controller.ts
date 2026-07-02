import { Request, Response } from 'express';
import * as departmentService from '../services/department.service';

export async function list(req: Request, res: Response) {
  res.json(await departmentService.listDepartments());
}

export async function create(req: Request, res: Response) {
  const saved = await departmentService.upsertDepartment({ ...req.body, id: undefined }, req.currentUser!);
  res.status(201).json(saved);
}

export async function update(req: Request, res: Response) {
  const saved = await departmentService.upsertDepartment({ ...req.body, id: req.params.id }, req.currentUser!);
  res.json(saved);
}

export async function remove(req: Request, res: Response) {
  await departmentService.deleteDepartment(req.params.id, req.currentUser!);
  res.status(204).end();
}
