import { Elysia, t } from 'elysia';
import { SubscriptionsService } from './subscriptions.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const subscriptionsService = new SubscriptionsService();

export const subscriptionsController = new Elysia({ prefix: '/v1/subscriptions' })
  .use(requireAuth)
  
  // Get available plans (Any authenticated user can see plans for a branch)
  .get('/plans', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const plans = await subscriptionsService.getPlans(user.tenantId, query.branchId);
    return { success: true, data: plans };
  }, {
    query: t.Object({
      branchId: t.Optional(t.String()),
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
  )
  
  // Create a new subscription plan (restricted to Super Admins & Tenant Owners)
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
  );
