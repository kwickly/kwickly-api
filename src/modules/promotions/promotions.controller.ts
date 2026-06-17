import { Elysia, t } from 'elysia';
import { PromotionsService } from './promotions.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const promotionsService = new PromotionsService();

export const promotionsController = new Elysia({ prefix: '/v1/promotions' })
  .use(requireAuth)

  // Public/Customer-facing endpoints
  .get('/coupons', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const coupons = await promotionsService.getCoupons(user.tenantId);
    return { success: true, data: coupons };
  })

  // POS-facing
  .get('/predefined-discounts', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const discounts = await promotionsService.getPredefinedDiscounts(user.tenantId);
    return { success: true, data: discounts };
  })

  // Manager-facing endpoints to create promotions
  .use(requirePermission('promotions:manage'))

  .post('/coupons', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const coupon = await promotionsService.createCoupon(user.tenantId, body as any);
    return { success: true, data: coupon };
  }, {
    body: t.Object({
      code: t.String(),
      discountType: t.Union([t.Literal('PERCENTAGE'), t.Literal('FLAT')]),
      discountValue: t.String(),
      minOrderValue: t.Optional(t.String()),
      maxDiscountAmount: t.Optional(t.String()),
    })
  })

  .post('/predefined-discounts', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const discount = await promotionsService.createPredefinedDiscount(user.tenantId, body as any);
    return { success: true, data: discount };
  }, {
    body: t.Object({
      name: t.String(),
      discountType: t.Union([t.Literal('PERCENTAGE'), t.Literal('FLAT')]),
      discountValue: t.String(),
      requiresManagerPin: t.Boolean(),
    })
  });
