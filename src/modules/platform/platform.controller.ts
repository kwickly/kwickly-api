import { Elysia, t } from 'elysia';
import { requireAuth } from '../auth/auth.guard.ts';
import { PlatformService } from './platform.service.ts';

const platformService = new PlatformService();

/**
 * Platform Administration Guard
 * Restricts access to Platform Owners and Super Admins only.
 */
const requirePlatformAdmin = (app: Elysia) => app
  .use(requireAuth)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }
    if (user.role !== 'platform_owner' && user.role !== 'super_admin') {
      set.status = 403;
      return { success: false, error: 'Forbidden: Platform Owner access required' };
    }
  });

/**
 * Platform Management Controller
 * Path: /v1/platform
 */
export const platformController = new Elysia({ prefix: '/v1/platform' })
  .use(requirePlatformAdmin)

  /**
   * GET /v1/platform/metrics
   * Aggregate SaaS billing plans, global scans/orders, and active tenant totals.
   */
  .get('/metrics', async () => {
    const data = await platformService.getPlatformMetrics();
    return { success: true, data };
  })

  /**
   * GET /v1/platform/tenants
   * Retrieve all tenants.
   */
  .get('/tenants', async ({ query }) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 12;
    const result = await platformService.listTenants(page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  /**
   * POST /v1/platform/tenants
   * Register a new restaurant tenant.
   */
  .post('/tenants', async ({ body }) => {
    const data = await platformService.createTenant(body);
    return { success: true, data, message: 'Tenant registered successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      slug: t.String(),
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      address: t.Optional(t.String()),
      plan: t.Optional(t.Union([
        t.Literal('FREE'),
        t.Literal('STARTER'),
        t.Literal('GROWTH'),
        t.Literal('ENTERPRISE')
      ])),
      brandColor: t.Optional(t.String()),
    })
  })

  /**
   * PATCH /v1/platform/tenants/:id
   * Modify a tenant's profile, SaaS billing tier, or active status.
   */
  .patch('/tenants/:id', async ({ params: { id }, body }) => {
    const data = await platformService.updateTenant(id, body);
    return { success: true, data, message: 'Tenant updated successfully' };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      email: t.String(),
      phone: t.String(),
      address: t.String(),
      plan: t.Union([
        t.Literal('FREE'),
        t.Literal('STARTER'),
        t.Literal('GROWTH'),
        t.Literal('ENTERPRISE')
      ]),
      status: t.Optional(t.Union([t.Literal('ACTIVE'), t.Literal('SUSPENDED'), t.Literal('TERMINATED')])),
    }))
  })

  /**
   * DELETE /v1/platform/tenants/:id
   * Soft delete a tenant.
   */
  .delete('/tenants/:id', async ({ params: { id } }) => {
    await platformService.deleteTenant(id);
    return { success: true, message: 'Tenant deleted successfully' };
  })

  /**
   * GET /v1/platform/audit-logs
   * Retrieve chronological system mutation audit logs.
   */
  .get('/audit-logs', async ({ query }) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const result = await platformService.getAuditLogs(page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  /**
   * POST /v1/platform/impersonate/:tenantId
   * Allows a platform admin to generate a short-lived token to impersonate a tenant.
   */
  .post('/impersonate/:tenantId', async ({ params: { tenantId }, user }) => {
    if (!user) throw new Error('Unauthorized');
    const data = await platformService.generateImpersonationToken(user.sub, tenantId);
    return { success: true, data, message: 'Impersonation session started' };
  });
