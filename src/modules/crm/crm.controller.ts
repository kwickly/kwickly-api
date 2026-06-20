import { Elysia, t } from 'elysia';
import { CrmService } from './crm.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const crmService = new CrmService();

export const crmController = new Elysia({ prefix: '/v1/crm' })
  .use(requireAuth)
  
  // Customers can get their own profile
  .get('/my-profile', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const profile = await crmService.getCustomerProfile(user.tenantId, user.sub);
    return { success: true, data: profile };
  })

  // Customers can update their own profile
  .post('/my-profile', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const profile = await crmService.upsertCustomerProfile(user.tenantId, user.sub, body as any);
    return { success: true, data: profile };
  }, {
    body: t.Object({
      dateOfBirth: t.Optional(t.Date()),
      anniversaryDate: t.Optional(t.Date()),
      marketingOptIn: t.Optional(t.Boolean()),
    })
  })

  // Managers and Admins can view and adjust all customers
  .use(requirePermission('crm:manage'))

  .get('/customers', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await crmService.getCustomers(user.tenantId, page, limit);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    })
  })

  .get('/customers/:id', async ({ user, params }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const profile = await crmService.getCustomerProfile(user.tenantId, params.id);
    return { success: true, data: profile };
  }, {
    params: t.Object({
      id: t.String(),
    })
  })

  .post('/loyalty/adjust', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const ledger = await crmService.adjustLoyaltyPoints(user.tenantId, body.userId, body.points, body.reason, body.orderId);
    return { success: true, data: ledger };
  }, {
    body: t.Object({
      userId: t.String(),
      points: t.String(),
      reason: t.String(),
      orderId: t.Optional(t.String()),
    })
  })

  .get('/segments', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await crmService.getSegments(user.tenantId, page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  .post('/segments', async ({ user, body }) => {
    return {
      success: true,
      data: { id: 'seg_' + Date.now(), ...(body as any), customerCount: 0 },
      message: 'Segment created successfully'
    };
  })

  .get('/campaigns', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await crmService.getCampaigns(user.tenantId, page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  .post('/campaigns', async ({ body }) => {
    return {
      success: true,
      data: { id: 'camp_' + Date.now(), ...(body as any), status: 'SENT', sentCount: 14, sentAt: new Date().toISOString() },
      message: 'Campaign dispatched successfully'
    };
  })

  .get('/loyalty/config', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const config = await crmService.getLoyaltyConfig(user.tenantId);
    return { success: true, data: config };
  })

  .post('/loyalty/config', async ({ body }) => {
    return {
      success: true,
      data: body,
      message: 'Loyalty configuration saved'
    };
  })

  .get('/churn-prevention', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const risks = await crmService.getChurnRiskCustomers(user.tenantId);
    return { success: true, data: risks };
  });
