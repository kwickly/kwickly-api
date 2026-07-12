import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';

/**
 * Sync Controller
 * Provides WebSockets and endpoints for real-time device syncing (POS, KDS, Customer displays).
 * Base Path: /v1/sync
 */
export const syncController = new Elysia({ prefix: '/v1/sync' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    })
  )
  .ws('/ws', {
    query: t.Object({
      token: t.String(),
    }),
    async open(ws) {
      const token = ws.data.query.token;
      try {
        const payload = await ws.data.jwt.verify(token);
        if (!payload || !payload.tenantId || !payload.branchId) {
          ws.send(JSON.stringify({ error: 'Unauthorized' }));
          ws.close();
          return;
        }

        const topic = `branch:${payload.branchId}:sync`;
        ws.subscribe(topic);
        
        ws.send(JSON.stringify({ 
          type: 'CONNECTION_ESTABLISHED', 
          message: `Listening to sync events for branch ${payload.branchId}` 
        }));
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Invalid Token' }));
        ws.close();
      }
    },
    message(ws, message) {
      // Future: ping/pong or active state reporting
    },
    close(ws) {
      // Unsubscribed automatically by Bun
    },
  });
