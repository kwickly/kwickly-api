import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';

import { loggerPlugin, logger } from './shared/logger.ts';
import { authController } from './modules/auth/auth.controller.ts';
import { platformController } from './modules/platform/platform.controller.ts';
import { tenantController } from './modules/tenant/tenant.controller.ts';
import { auditPlugin } from './shared/audit.ts';

import { branchesController } from './modules/branches/branches.controller.ts';
import { menusController } from './modules/menus/menus.controller.ts';

import { ordersController } from './modules/orders/orders.controller.ts';
import { kotsController } from './modules/kots/kots.controller.ts';
import { websocketPlugin } from './shared/websocket.ts';

import { analyticsController } from './modules/analytics/analytics.controller.ts';
import { hardwareController } from './modules/hardware/hardware.controller.ts';
import { devicesController } from './modules/devices/devices.controller.ts';

import { subscriptionsController } from './modules/subscriptions/subscriptions.controller.ts';
import { attendanceController } from './modules/attendance/attendance.controller.ts';

import { combosController } from './modules/combos/combos.controller.ts';
import { promotionsController } from './modules/promotions/promotions.controller.ts';
import { paymentsController } from './modules/payments/payments.controller.ts';
import { crmController } from './modules/crm/crm.controller.ts';
import { walletController } from './modules/crm/wallet.controller.ts';
import { inventoryController } from './modules/inventory/inventory.controller.ts';
import { staffController } from './modules/staff/staff.controller.ts';
import { platformStaffController } from './modules/staff/platform-staff.controller.ts';
import { payrollController } from './modules/payroll/payroll.controller.ts';
import { rolesController } from './modules/roles/roles.controller.ts';
import { auditController } from './modules/audit/audit.controller.ts';
import { leaveController } from './modules/staff/leave.controller.ts';
import { adsController } from './modules/ads/ads.controller.ts';
import { notificationsController } from './modules/notifications/notifications.controller.ts';
import { usersController } from './modules/users/users.controller.ts';
import { supportController } from './modules/support/support.controller.ts';
import { platformSupportController } from './modules/support/platform-support.controller.ts';
import { syncController } from './modules/sync/sync.controller.ts';

export const app = new Elysia()
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
      .use(platformController)
      .use(tenantController)
      .use(usersController)

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
      .use(devicesController)

      // Register Final Phase Modules
      .use(combosController)
      .use(promotionsController)
      .use(paymentsController)
      .use(crmController)
      .use(walletController)
      .use(inventoryController)
      .use(staffController)
      .use(platformStaffController)
      .use(payrollController)
      .use(rolesController)
      .use(auditController)
      .use(leaveController)
      .use(adsController)
      .use(notificationsController)
      .use(supportController)
      .use(platformSupportController)
      .use(syncController)
  )
  
  .use(websocketPlugin);
