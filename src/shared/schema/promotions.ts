import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  decimal,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const discountTypeEnum = pgEnum('discount_type', [
  'PERCENTAGE',
  'FLAT',
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Customer-facing promotional coupons (e.g., 'SUMMER20')
 */
export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(), // Should be unique per tenant, usually handled via composite index or logic
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal('min_order_value', { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  usageLimit: integer('usage_limit'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // soft delete
});

/**
 * Staff-facing predefined discounts applied at the POS (e.g., 'Staff Meal 50%')
 */
export const predefinedDiscounts = pgTable('predefined_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  requiresManagerPin: boolean('requires_manager_pin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const couponsRelations = relations(coupons, ({ one }) => ({
  tenant: one(tenants, {
    fields: [coupons.tenantId],
    references: [tenants.id],
  }),
}));

export const predefinedDiscountsRelations = relations(predefinedDiscounts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [predefinedDiscounts.tenantId],
    references: [tenants.id],
  }),
}));

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type PredefinedDiscount = typeof predefinedDiscounts.$inferSelect;
export type NewPredefinedDiscount = typeof predefinedDiscounts.$inferInsert;
