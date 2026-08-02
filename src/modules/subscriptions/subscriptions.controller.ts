import { Elysia, t } from 'elysia';
import { SubscriptionsService } from './subscriptions.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { db } from '../../db';
import { tenants, tenantBrandings } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

const subscriptionsService = new SubscriptionsService();

export const subscriptionsController = new Elysia({ prefix: '/v1/subscriptions' })
  // Public endpoint to get plans by tenant hostname
  .get('/public/plans', async ({ query }) => {
    try {
      const hostname = query.hostname as string;
      if (!hostname) return { success: false, error: 'Hostname required' };

      let slug = hostname;
      if (hostname.includes('kwickly.com') || hostname.includes('localhost')) {
        slug = hostname.split('.')[0] || hostname;
      }

      const tenantResult = await db.select({ id: tenants.id })
        .from(tenants)
        .leftJoin(tenantBrandings, eq(tenants.id, tenantBrandings.tenantId))
        .where(or(eq(tenants.slug, slug), eq(tenantBrandings.customDomain, hostname)))
        .limit(1);

      if (!tenantResult || tenantResult.length === 0 || !tenantResult[0]?.id) {
        return { success: false, error: 'Tenant not found' };
      }

      const plans = await subscriptionsService.getPlans(tenantResult[0].id, undefined, false);
      return { success: true, data: plans };
    } catch (err) {
      console.error('Failed to get public plans', err);
      return { success: false, error: 'Internal server error' };
    }
  }, {
    query: t.Object({
      hostname: t.String()
    })
  })

  // Authenticated routes below
  .use(requireAuth)
  
  // Get available plans (Any authenticated user can see plans for a branch)
  .get('/plans', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const includeInactive = query.includeInactive === 'true' || query.includeInactive === true;
    const plans = await subscriptionsService.getPlans(user.tenantId, query.branchId, includeInactive);
    return { success: true, data: plans };
  }, {
    query: t.Object({
      branchId: t.Optional(t.String()),
      includeInactive: t.Optional(t.Union([t.String(), t.Boolean()])),
    })
  })

  // Customer purchases a plan
  .post('/purchase', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    // In a real flow, this creates a pending invoice and returns a Razorpay order ID.
    // We are mocking instant fulfillment for now.
    const sub = await subscriptionsService.purchasePlan(user.tenantId, user.sub, body.planId);
    return { success: true, data: sub };
  }, {
    body: t.Object({
      planId: t.String(),
    })
  })

  // Customer gets their dynamic, anti-fraud QR Code
  .get('/my-qr', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const qrBase64 = await subscriptionsService.generateQR(user.tenantId, user.sub);
    return { success: true, qr: qrBase64 };
  })

  // Only staff/scanners can deduct meals
  .group('', (app) =>
    app
      .use(requirePermission('orders:write'))
      .post('/staff/deduct-meal', async ({ user, body }) => {
        if (!user || !user.tenantId || !user.branchId) {
          throw new Error('Staff user must be assigned to a branch to scan QR codes.');
        }
        
        const result = await subscriptionsService.scanQR(user.tenantId, user.branchId, user.sub, body.qrData);
        return result;
      }, {
        body: t.Object({
          qrData: t.String(),
        })
      })
      .post('/staff/sell-offline', async ({ user, body }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        // Register cash payment logic and assign subscription to customer
        const sub = await subscriptionsService.purchasePlan(user.tenantId, body.customerId, body.planId);
        return { success: true, data: sub, message: 'Offline subscription sold successfully.' };
      }, {
        body: t.Object({
          customerId: t.String(),
          planId: t.String(),
        })
      })
  )
  
  // Create, Edit, Delete a subscription plan (restricted to Super Admins & Tenant Owners)
  .group('', (app) =>
    app
      .use(requirePermission('subscriptions:manage'))
      .post('/plans', async ({ user, body }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        const plan = await subscriptionsService.createPlan(user.tenantId, body as any);
        return { success: true, data: plan, message: 'Plan created' };
      }, {
        body: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          mealType: t.Union([t.Literal('lunch'), t.Literal('dinner'), t.Literal('both')]),
          planType: t.Union([t.Literal('meal_count'), t.Literal('monthly'), t.Literal('custom')]),
          totalMeals: t.Number(),
          validityDays: t.Number(),
          price: t.String(),
          branchId: t.Optional(t.String()),
          carryForward: t.Optional(t.Boolean()),
          allowHoliday: t.Optional(t.Boolean()),
        })
      })
      .patch('/plans/:id', async ({ user, params, body }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        const plan = await subscriptionsService.updatePlan(user.tenantId, params.id, body as any);
        return { success: true, data: plan, message: 'Plan updated' };
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          description: t.Optional(t.String()),
          mealType: t.Optional(t.Union([t.Literal('lunch'), t.Literal('dinner'), t.Literal('both')])),
          planType: t.Optional(t.Union([t.Literal('meal_count'), t.Literal('monthly'), t.Literal('custom')])),
          totalMeals: t.Optional(t.Number()),
          validityDays: t.Optional(t.Number()),
          price: t.Optional(t.String()),
          branchId: t.Optional(t.String()),
          carryForward: t.Optional(t.Boolean()),
          allowHoliday: t.Optional(t.Boolean()),
          status: t.Optional(t.Union([t.Literal('ACTIVE'), t.Literal('GRANDFATHERED'), t.Literal('ARCHIVED')])),
        })
      })
      .delete('/plans/:id', async ({ user, params }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        const plan = await subscriptionsService.deletePlan(user.tenantId, params.id);
        return { success: true, data: plan, message: 'Plan deleted' };
      })
      .get('/customers', async ({ user }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        const subscriptions = await subscriptionsService.getCustomerSubscriptions(user.tenantId);
        return { success: true, data: subscriptions };
      })
      .patch('/customers/:id/status', async ({ user, params, body }) => {
        if (!user || !user.tenantId) throw new Error('Unauthorized');
        const subscription = await subscriptionsService.updateCustomerSubscriptionStatus(user.tenantId, params.id, body.status);
        return { success: true, data: subscription, message: 'Subscription status updated' };
      }, {
        body: t.Object({
          status: t.Union([t.Literal('active'), t.Literal('paused'), t.Literal('cancelled')])
        })
      })
  );
