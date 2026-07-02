import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { AppDataSource } from '../config/data-source';
import { initTestDb, truncateAll, closeTestDb } from '../test/dbTestUtils';
import { User, AuditLog } from '../entities';
import { hashPassword } from '../services/auth.service';
import { createApp } from '../app';

const app = createApp();

beforeAll(async () => {
  await initTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await truncateAll();
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.save(
    userRepo.create({ username: 'admin', fullName: 'Administrator', role: 'admin', email: 'a@a.com', passwordHash: await hashPassword('admin123') })
  );
});

describe('POST /api/auth/login', () => {
  it('đăng nhập đúng mật khẩu trả về user + allowedTabs, và /me giữ được phiên qua cookie', async () => {
    const agent = request.agent(app);
    const loginRes = await agent.post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.username).toBe('admin');
    expect(loginRes.body.allowedTabs).toContain('users');

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe('admin');
  });

  it('đăng nhập sai mật khẩu trả 401 và vẫn ghi audit log LOGIN success=false', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'sai-mat-khau' });
    expect(res.status).toBe(401);

    const logs = await AppDataSource.getRepository(AuditLog).find({ where: { action: 'LOGIN' } });
    expect(logs.some((l) => !l.success)).toBe(true);
  });

  it('GET /api/auth/me khi chưa đăng nhập trả 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
