import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export type JwtPayload = {
  sub: string;         // User ID
  role: string;        // user_role
  tenantId: string | null;
  branchId: string | null;
};

// 1. The Setup Plugin: Provides `jwt` utilities and parses `user` from incoming tokens
export const authPlugin = (app: Elysia) => app
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'super-secret-fallback-key',
      exp: '15m', // Access tokens expire quickly (Stateless)
    })
  )
  .derive(async ({ jwt, cookie: { auth_session }, headers }) => {
    // 1. Try to get token from Authorization header (Bearer token) - for Mobile App
    let token = headers['authorization']?.split(' ')[1];
    
    // 2. Fallback to cookie if no header - for Web App
    if (!token && auth_session?.value) {
      token = auth_session.value as string;
    }

    if (!token) {
      return { user: null };
    }

    // Verify token
    const payload = await jwt.verify(token) as JwtPayload | false;
    
    if (!payload) {
      return { user: null };
    }

    return { user: payload };
  });

// 2. The Guard: Enforces that `user` exists, blocking the request if not
export const requireAuth = (app: Elysia) => app
  .use(authPlugin)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized', message: 'Missing or invalid access token' };
    }
  });
