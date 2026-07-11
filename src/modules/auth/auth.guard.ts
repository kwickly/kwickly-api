import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { rolePermissions, permissions } from '../../db/schema/rbac';

export type JwtPayload = {
  sub: string;         // User ID
  role: string;        // user_role
  roleId: string | null; // rbac role id
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

    // Support impersonation for Platform Owners/Super Admins
    const impersonateTenantId = headers['x-impersonate-tenant-id'] as string | undefined;
    if (impersonateTenantId && (payload.role === 'platform_owner' || payload.role === 'super_admin')) {
      payload.tenantId = impersonateTenantId;
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

// 3. Granular RBAC Guard: Checks if the user's role has the required permissions
export const requirePermissions = (requiredPermissions: string[]) => (app: Elysia) => app
  .use(requireAuth)
  .onBeforeHandle(async ({ user, set }) => {
    if (!user) return; // handled by requireAuth

    // Platform owners bypass all permission checks
    if (user.role === 'platform_owner' || user.role === 'super_admin' || user.role === 'tenant_owner') {
      return; 
    }

    if (!user.roleId) {
      set.status = 403;
      return { error: 'Forbidden', message: 'User has no assigned role' };
    }

    try {
      // Fetch user's permissions from the DB
      const userPermissions = await db
        .select({ slug: permissions.slug })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, user.roleId));

      const userPermissionSlugs = userPermissions.map(p => p.slug);

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(rp => userPermissionSlugs.includes(rp));

      if (!hasAllPermissions) {
        set.status = 403;
        return { 
          error: 'Forbidden', 
          message: 'Insufficient permissions',
          required: requiredPermissions
        };
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      set.status = 500;
      return { error: 'Internal Server Error', message: 'Failed to verify permissions' };
    }
  });
