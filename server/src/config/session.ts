import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';

const pgPool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.username,
  password: env.db.password,
  database: env.db.database,
});

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ pool: pgPool, tableName: 'session', createTableIfMissing: true }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'ydungcu.sid',
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 giờ — phù hợp một ca trực
  },
});

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
