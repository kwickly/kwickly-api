import { Elysia, t } from 'elysia';
import { CrmService } from './crm.service';
import { requireAuth } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';

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
  .use(requireRoles(['super_admin', 'tenant_owner', 'manager']))

  .get('/customers', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const customers = await crmService.getCustomers(user.tenantId);
    return { success: true, data: customers };
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
  });
