import { Elysia, t } from 'elysia';
import { eventBus, EVENTS } from './events.ts';
import { jwt } from '@elysiajs/jwt';

/**
 * WebSocket Plugin for Kwickly API
 * Handles real-time communication with the Kitchen Display System (KDS) tablets.
 */
export const websocketPlugin = new Elysia({ name: 'kds-websocket' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    })
  )
  .ws('/kds', {
    // Expected query param: ?token=ey...
    query: t.Object({
      token: t.String(),
    }),
    async open(ws) {
      // 1. Authenticate the WebSocket connection
      const token = ws.data.query.token;
      const payload = await ws.data.jwt.verify(token);

      if (!payload || !payload.tenantId || !payload.branchId) {
        ws.send(JSON.stringify({ error: 'Unauthorized' }));
        ws.close();
        return;
      }

      // 2. Subscribe to the specific branch's topic
      // Bun Native WebSockets makes topic pub/sub incredibly fast
      const topic = `branch:${payload.branchId}:kots`;
      ws.subscribe(topic);
      
      ws.send(JSON.stringify({ 
        type: 'CONNECTION_ESTABLISHED', 
        message: `Listening to KDS events for branch ${payload.branchId}` 
      }));
    },
    message(ws, message) {
      // Future: Handle incoming messages from KDS if necessary
      // e.g., A quick ping/pong or a status update directly over WS
    },
    close(ws) {
      // Bun automatically unsubscribes the socket on close
    },
  });

/**
 * Wire the global Event Bus to the WebSocket publisher.
 * Whenever a service emits an internal event, we broadcast it to the relevant WebSocket topic.
 */
eventBus.on(EVENTS.NEW_KOT, (payload: { branchId: string, kot: any, order: any, items: any[] }) => {
  const topic = `branch:${payload.branchId}:kots`;
  // Using Elysia's global server instance to publish to the Bun topic
  // Note: we can't directly access `app.server` easily from outside the app unless exported,
  // but Elysia's `server` is injected into the context of WS routes.
  // Actually, Bun exposes a global publish if we need it, but Elysia requires a trick.
  // We will listen to the event bus inside the main `index.ts` where `app` is defined, 
  // or we can just keep the logic here if we inject the server instance later.
});
