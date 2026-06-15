import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { loggerPlugin, logger } from './shared/logger';
import { requireAuth } from './modules/auth/auth.guard';
import { requireRoles } from './modules/auth/rbac.guard';
import { authController } from './modules/auth/auth.controller';
import { auditPlugin } from './shared/audit';

import { branchesController } from './modules/branches/branches.controller';
import { menusController } from './modules/menus/menus.controller';
import { usersController } from './modules/users/users.controller';

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

  .listen(process.env.PORT ?? 3000);

logger.info(`🦊 Kwickly API is running at ${app.server?.hostname}:${app.server?.port}`);
