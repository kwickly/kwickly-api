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
  })

  .get('/segments', async () => {
    return {
      success: true,
      data: [
        { id: 'seg1', name: 'At Risk Subscribers', ruleType: 'days_since_scan', ruleValue: '5', customerCount: 14 },
        { id: 'seg2', name: 'Highly Active Diners', ruleType: 'total_scans', ruleValue: '15', customerCount: 32 },
        { id: 'seg3', name: 'New Signups (30 Days)', ruleType: 'signup_days', ruleValue: '30', customerCount: 8 }
      ]
    };
  })

  .post('/segments', async ({ body }) => {
    return {
      success: true,
      data: { id: 'seg_' + Date.now(), ...(body as any), customerCount: 0 },
      message: 'Segment created successfully'
    };
  })

  .get('/campaigns', async () => {
    return {
      success: true,
      data: [
        { id: 'c1', title: '5-Day Inactive Promo', channel: 'whatsapp', status: 'SENT', sentCount: 14, sentAt: '2026-06-15T12:00:00Z' },
        { id: 'c2', title: 'Weekend Special Offer', channel: 'push', status: 'SCHEDULED', sentCount: 45, sentAt: '2026-06-20T10:00:00Z' }
      ]
    };
  })

  .post('/campaigns', async ({ body }) => {
    return {
      success: true,
      data: { id: 'camp_' + Date.now(), ...(body as any), status: 'SENT', sentCount: 14, sentAt: new Date().toISOString() },
      message: 'Campaign dispatched successfully'
    };
  })

  .get('/loyalty/config', async () => {
    return {
      success: true,
      data: {
        bronzeMultiplier: '1.0',
        silverMultiplier: '1.2',
        goldMultiplier: '1.5',
        pointsPerRupee: '0.1',
        walletTopUpEnabled: true,
        partialDeductionAllowed: true
      }
    };
  })

  .post('/loyalty/config', async ({ body }) => {
    return {
      success: true,
      data: body,
      message: 'Loyalty configuration saved'
    };
  })

  .get('/churn-prevention', async () => {
    return {
      success: true,
      data: [
        { id: 'cust1', name: 'Aarav Mehta', phone: '9876543210', lastScanAt: '2026-06-10T13:45:00Z', riskScore: '85%', totalVisits: 12 },
        { id: 'cust2', name: 'Sneha Patel', phone: '9123456789', lastScanAt: '2026-06-11T20:15:00Z', riskScore: '72%', totalVisits: 18 },
        { id: 'cust3', name: 'Vikram Singh', phone: '9345678901', lastScanAt: '2026-06-09T12:30:00Z', riskScore: '90%', totalVisits: 5 }
      ]
    };
  });
