import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { db } from '../../db';
import { tenants } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Tenant Settings Controller
 * Path: /v1/tenant
 */
export const tenantController = new Elysia({ prefix: '/v1/tenant' })
  .use(authPlugin)
  .use(requirePermission('settings:manage'))

  /**
   * GET /v1/tenant/settings
   * Retrieves the current tenant's profile, including branding colors and logo.
   */
  .get('/settings', async ({ user, set }) => {
    if (!user?.tenantId) {
      set.status = 400;
      return { success: false, error: 'User is not associated with a tenant' };
    }
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId));
    if (!tenant) {
      set.status = 404;
      return { success: false, error: 'Tenant not found' };
    }
    return { success: true, data: tenant };
  })

  /**
   * PATCH /v1/tenant/settings
   * Updates the current tenant's branding and profile.
   */
  .patch('/settings', async ({ user, body, set }) => {
    if (!user?.tenantId) {
      set.status = 400;
      return { success: false, error: 'User is not associated with a tenant' };
    }
    
    const updated = await db
      .update(tenants)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, user.tenantId))
      .returning();

    return { 
      success: true, 
      data: updated[0], 
      message: 'Tenant settings updated successfully' 
    };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      brandColor: t.String(),
      logoUrl: t.String(),
      phone: t.String(),
      email: t.String(),
      address: t.String()
    }))
  });
