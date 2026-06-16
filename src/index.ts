import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';

import { loggerPlugin, logger } from './shared/logger';
import { requireAuth } from './modules/auth/auth.guard';
import { requireRoles } from './modules/auth/rbac.guard';
import { authController } from './modules/auth/auth.controller';
import { auditPlugin } from './shared/audit';

import { branchesController } from './modules/branches/branches.controller.ts';
import { menusController } from './modules/menus/menus.controller.ts';

import { ordersController } from './modules/orders/orders.controller.ts';
import { kotsController } from './modules/kots/kots.controller.ts';
import { websocketPlugin } from './shared/websocket.ts';
import { eventBus, EVENTS } from './shared/events.ts';

import { analyticsController } from './modules/analytics/analytics.controller.ts';
import { hardwareController } from './modules/hardware/hardware.controller.ts';

import { subscriptionsController } from './modules/subscriptions/subscriptions.controller.ts';
import { attendanceController } from './modules/attendance/attendance.controller.ts';

import { combosController } from './modules/combos/combos.controller.ts';
import { promotionsController } from './modules/promotions/promotions.controller.ts';
import { paymentsController } from './modules/payments/payments.controller.ts';
import { crmController } from './modules/crm/crm.controller.ts';
import { inventoryController } from './modules/inventory/inventory.controller.ts';
import { staffController } from './modules/staff/staff.controller.ts';
import { payrollController } from './modules/payroll/payroll.controller.ts';
import { adsController } from './modules/ads/ads.controller.ts';
import { notificationsController } from './modules/notifications/notifications.controller.ts';

const app = new Elysia()
  .use(cors())
  .use(loggerPlugin)
  .use(auditPlugin)
  .use(
    process.env.NODE_ENV === 'production'
      ? (app) => app // Disable swagger in production
      : swagger({
          documentation: {
            info: {
              title: 'Kwickly API',
              version: '1.0.0',
              description: 'Backend API for Kwickly Platform'
            }
          }
        })
  )
  .use(rateLimit({
    duration: 60000, // 1 minute
    max: 100, // 100 requests per minute
    errorResponse: new Response(JSON.stringify({ success: false, error: 'Too Many Requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }))
  .onRequest(({ set }) => {
    // Basic Security Headers (Helmet equivalent)
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
    set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  })
  .onError(({ code, error, set }) => {
    logger.error(`[Error] ${code}: ${error.message}`);
    
    if (code === 'VALIDATION') {
      set.status = 400;
      return { success: false, error: 'Validation Error', details: error.message };
    }
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { success: false, error: 'Not Found' };
    }

    set.status = 500;
    return { success: false, error: 'Internal Server Error' };
  })
  .get('/health', ({ log }) => {
    log.info('Health check requested');
    return { status: 'ok', ts: new Date().toISOString() };
  })
  
  .group('/api', (app) => 
    app
      // Register Phase 1 Modules
      .use(authController)

      // Register Phase 2 Modules
      .use(branchesController)
      .use(menusController)
      .use(subscriptionsController)
      .use(attendanceController)

      // Register Phase 4 & 5 Modules
      .use(ordersController)
      .use(kotsController)
      .use(analyticsController)
      .use(hardwareController)

      // Register Final Phase Modules
      .use(combosController)
      .use(promotionsController)
      .use(paymentsController)
      .use(crmController)
      .use(inventoryController)
      .use(staffController)
      .use(payrollController)
      .use(adsController)
      .use(notificationsController)
  )
  
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

// --- Graceful Shutdown ---
const shutdown = () => {
  logger.info('SIGINT/SIGTERM received. Shutting down gracefully...');
  
  if (app.server) {
    app.server.stop();
    logger.info('Server stopped accepting new connections.');
  }

  // E.g., close DB connections or redis connections here if needed
  // db.$client.end();
  // redis.quit();

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
