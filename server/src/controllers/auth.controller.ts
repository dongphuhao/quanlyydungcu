import { Request, Response } from 'express';
import { verifyLogin, recordLoginAttempt, recordLogout, buildMeResponse } from '../services/auth.service';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    return;
  }

  const user = await verifyLogin(username, password);
  await recordLoginAttempt(user, username, !!user);

  if (!user) {
    res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    return;
  }

  req.session.userId = user.id;
  res.json(buildMeResponse(user));
}

export async function logout(req: Request, res: Response) {
  if (req.currentUser) {
    await recordLogout(req.currentUser);
  }
  req.session.destroy(() => {
    res.clearCookie('ydungcu.sid');
    res.json({ ok: true });
  });
}

export async function me(req: Request, res: Response) {
  if (!req.currentUser) {
    res.status(401).json({ message: 'Chưa đăng nhập' });
    return;
  }
  res.json(buildMeResponse(req.currentUser));
}
