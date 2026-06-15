import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { loggerPlugin, logger } from './shared/logger';
import { requireAuth } from './modules/auth/auth.guard';
import { requireRoles } from './modules/auth/rbac.guard';
import { authController } from './modules/auth/auth.controller';
import { auditPlugin } from './shared/audit';

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
  
  // Register Auth Module
  .use(authController)

  // Example of a completely public route
  .get('/public', () => ({ message: 'Anyone can see this' }))

  // Example of a route requiring ANY authenticated user
  .use(requireAuth)
  .get('/me', ({ user }) => ({ 
    message: 'You are authenticated!',
    user 
  }))

  // Example of a route requiring specifically a manager or higher
  .use(requireRoles(['manager', 'tenant_owner']))
  .post('/refund', ({ user, log }) => {
    log.info({ managerId: user.sub }, 'Refund initiated');
    return { status: 'refund_successful', by: user.role };
  })

  .listen(process.env.PORT ?? 3000);

logger.info(`🦊 Kwickly API is running at ${app.server?.hostname}:${app.server?.port}`);
