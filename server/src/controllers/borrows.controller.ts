import { Request, Response } from 'express';
import * as borrowService from '../services/borrow.service';

export async function list(req: Request, res: Response) {
  res.json(await borrowService.listBorrows());
}

export async function create(req: Request, res: Response) {
  const saved = await borrowService.requestBorrow(req.body, req.currentUser!);
  res.status(201).json(saved);
}

export async function approve(req: Request, res: Response) {
  res.json(await borrowService.approveBorrow(req.params.id, req.currentUser!));
}

export async function requestReturn(req: Request, res: Response) {
  res.json(await borrowService.requestReturn(req.params.id, req.currentUser!));
}

export async function approveReturn(req: Request, res: Response) {
  res.json(await borrowService.approveReturn(req.params.id, req.currentUser!));
}

export async function reject(req: Request, res: Response) {
  res.json(await borrowService.rejectRequest(req.params.id, req.currentUser!));
}
