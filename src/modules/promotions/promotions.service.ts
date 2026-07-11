import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index';
import { coupons, predefinedDiscounts } from '../../db/schema/promotions';

export class PromotionsService {
  /**
   * Fetch active coupons for a tenant
   */
  async getCoupons(tenantId: string) {
    return await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.tenantId, tenantId),
          eq(coupons.status, 'ACTIVE'),
          isNull(coupons.deletedAt)
        )
      )
      .execute();
  }

  /**
   * Create a new coupon
   */
  async createCoupon(tenantId: string, payload: {
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: string;
    minOrderValue?: string;
    maxDiscountAmount?: string;
  }) {
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        tenantId,
        code: payload.code.toUpperCase(),
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        minOrderValue: payload.minOrderValue,
        maxDiscountAmount: payload.maxDiscountAmount,
      })
      .returning();
    return newCoupon;
  }

  /**
   * Fetch predefined POS discounts
   */
  async getPredefinedDiscounts(tenantId: string) {
    return await db
      .select()
      .from(predefinedDiscounts)
      .where(
        and(
          eq(predefinedDiscounts.tenantId, tenantId),
          eq(predefinedDiscounts.status, 'ACTIVE'),
          isNull(predefinedDiscounts.deletedAt)
        )
      )
      .execute();
  }

  /**
   * Create a predefined POS discount
   */
  async createPredefinedDiscount(tenantId: string, payload: {
    name: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: string;
    requiresManagerPin: boolean;
  }) {
    const [discount] = await db
      .insert(predefinedDiscounts)
      .values({
        tenantId,
        name: payload.name,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        requiresManagerPin: payload.requiresManagerPin,
      })
      .returning();
    return discount;
  }
}
