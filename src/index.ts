import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { loggerPlugin, logger } from './shared/logger';
import { requireAuth } from './modules/auth/auth.guard';
import { requireRoles } from './modules/auth/rbac.guard';
import { authController } from './modules/auth/auth.controller';
import { auditPlugin } from './shared/audit';

import { branchesController } from './modules/branches/branches.controller.ts';
import { menusController } from './modules/menus/menus.controller.ts';
import { usersController } from './modules/users/users.controller.ts';

import { ordersController } from './modules/orders/orders.controller.ts';
import { kotsController } from './modules/kots/kots.controller.ts';
import { websocketPlugin } from './shared/websocket.ts';
import { eventBus, EVENTS } from './shared/events.ts';

const app = new Elysia()
  .use(cors())
  .use(loggerPlugin)
  .use(auditPlugin)
  .use(swagger({
    documentation: {
      info: {
        title: 'Kwickly API',
        version: '1.0.0',
        description: 'Backend API for Kwickly Platform'
      }
    }
  }))
  .get('/health', ({ log }) => {
    log.info('Health check requested');
    return { status: 'ok', ts: new Date().toISOString() };
  })
  
  // Register Phase 1 Modules
  .use(authController)

  // Register Phase 2 Modules
  .use(branchesController)
  .use(menusController)
  .use(usersController)

  // Register Phase 4 Modules
  .use(ordersController)
  .use(kotsController)
  .use(websocketPlugin)

  .listen(process.env.PORT ?? 3000);

// Wire Event Bus to Bun WebSockets for zero-latency KDS Sync
eventBus.on(EVENTS.NEW_KOT, (payload) => {
  const topic = `branch:${payload.branchId}:kots`;
  app.server?.publish(topic, JSON.stringify({
    type: 'NEW_KOT',
    data: payload
  }));
});

eventBus.on(EVENTS.KOT_UPDATED, (payload) => {
  const topic = `branch:${payload.branchId}:kots`;
  app.server?.publish(topic, JSON.stringify({
    type: 'KOT_UPDATED',
    data: payload
  }));
});

logger.info(`🦊 Kwickly API is running at ${app.server?.hostname}:${app.server?.port}`);
