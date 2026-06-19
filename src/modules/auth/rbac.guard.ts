import { Elysia } from 'elysia';
import { requireAuth } from './auth.guard.ts';
import { loggerPlugin } from '../../shared/logger.ts';
import { db } from '../../db/index.ts';
import { roles, rolePermissions, permissions } from '../../db/schema/rbac.ts';
import { eq, and, isNull, or } from 'drizzle-orm';
import { withCache } from '../../shared/redis.ts';

/**
 * Permission check logic extracted for reuse in both plugins and individual handlers.
 */
export const checkPermission = (requiredSlugs: string | string[]) => async ({ user, set, log }: any) => {
  if (!user) {
    set.status = 401;
    return { error: 'Unauthorized' };
  }

  // Bypass permission checks for system administration roles
  if (user.role === 'platform_owner' || user.role === 'super_admin') {
    return;
  }

  const slugs = Array.isArray(requiredSlugs) ? requiredSlugs : [requiredSlugs];

  // Fetch user permissions with caching
  const cacheKey = `rbac:permissions:role:${user.role}:${user.tenantId || 'system'}`;
  
  const userPermissions = await withCache(cacheKey, async () => {
    // 1. Find the role record: Try tenant-specific custom role first
    let roleRecord = await db.query.roles.findFirst({
      where: and(
        eq(roles.slug, user.role),
        eq(roles.tenantId, user.tenantId as string)
      )
    });

    // Fall back to system role (where tenantId is null)
    if (!roleRecord) {
      roleRecord = await db.query.roles.findFirst({
        where: and(
          eq(roles.slug, user.role),
          isNull(roles.tenantId)
        )
      });
    }

    if (!roleRecord) return [];

    // 2. Fetch all permission slugs for this role
    const perms = await db
      .select({ slug: permissions.slug })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleRecord.id));

    return perms.map(p => p.slug);
  }, 300); // 5 minute cache

  // Check if user has at least one of the required permissions
  const hasPermission = slugs.some(s => userPermissions.includes(s));

  if (!hasPermission) {
    log?.warn(
        { userId: user.sub, role: user.role, required: slugs }, 
        'RBAC Forbidden: Missing required permissions'
    );
    set.status = 403;
    return { 
        error: 'Forbidden', 
        message: `You do not have the required permissions (${slugs.join(', ')}) to perform this action.` 
    };
  }
};

/**
 * Middleware to enforce Granular Permission-Based Access Control.
 * 
 * @param requiredSlugs Permission slug(s) required to access the route.
 */
export const requirePermission = (requiredSlugs: string | string[]) => (app: Elysia) => app
    .use(loggerPlugin)
    .use(requireAuth)
    .onBeforeHandle(checkPermission(requiredSlugs));

/**
 * @deprecated Use requirePermission instead for granular control.
 */
export const requireRoles = (allowedRoles: string[]) => (app: Elysia) => app
    .use(loggerPlugin)
    .use(requireAuth)
    .onBeforeHandle(({ user, set, log }) => {
      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      
      if (!allowedRoles.includes(user.role)) {
        log?.warn({ userId: user.sub, role: user.role, required: allowedRoles }, 'RBAC Forbidden Access Attempt');
        set.status = 403;
        return { error: 'Forbidden', message: `Your role (${user.role}) is not authorized.` };
      }
    });
