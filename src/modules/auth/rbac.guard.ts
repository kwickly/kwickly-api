import { Elysia } from 'elysia';
import { requireAuth } from './auth.guard';
import { loggerPlugin } from '../../shared/logger';

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Expects `requireAuth` to have run first.
 *
 * @param allowedRoles Array of roles permitted to access the route.
 */
export const requireRoles = (allowedRoles: string[]) => (app: Elysia) => app
    .use(loggerPlugin)
    .use(requireAuth) // Ensure user is authenticated first
    .onBeforeHandle(({ user, set, log }) => {
      // User is guaranteed to exist because of `requireAuth`, but TS needs checking
      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      
      // Super admins bypass all role checks
      if (user.role === 'super_admin') {
         return; 
      }

      // Check if user's role is in the allowed list
      if (!allowedRoles.includes(user.role)) {
        log?.warn({ userId: user.sub, role: user.role, required: allowedRoles }, 'RBAC Forbidden Access Attempt');
        set.status = 403;
        return { error: 'Forbidden', message: `Your role (${user.role}) is not authorized to perform this action.` };
      }
    });
