import {
  uuid,
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';
import { users } from './users';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const mealTypeEnum = pgEnum('meal_type', ['lunch', 'dinner', 'both']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'paused',
  'expired',
  'exhausted',  // all meals used before expiry
  'cancelled',
]);

export const planTypeEnum = pgEnum('plan_type', [
  'meal_count',    // e.g. 30 meals, use anytime
  'monthly',       // calendar month, resets on 1st
  'custom',        // custom date range
]);

// ─── Subscription Plans ───────────────────────────────────────────────────────
// Configured by the restaurant admin
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  branchId:         uuid('branch_id').references(() => branches.id), // null = valid at all branches
  name:             text('name').notNull(),         // e.g. "30-Day Lunch Plan"
  description:      text('description'),
  mealType:         mealTypeEnum('meal_type').notNull(),
  planType:         planTypeEnum('plan_type').default('meal_count').notNull(),
  totalMeals:       integer('total_meals').notNull(), // total meals included
  validityDays:     integer('validity_days').notNull(), // e.g. 30
  price:            numeric('price', { precision: 10, scale: 2 }).notNull(),
  carryForward:     boolean('carry_forward').default(false).notNull(), // unused meals carry to next plan
  allowHoliday:     boolean('allow_holiday').default(false).notNull(), // mark holiday to not deduct
  isActive:         boolean('is_active').default(true).notNull(),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  updatedAt:        timestamp('updated_at').defaultNow().notNull(),
  deletedAt:        timestamp('deleted_at'),
});

// ─── Customer Subscriptions ──────────────────────────────────────────────────
// One subscription per purchase — a customer can have multiple over time
export const customerSubscriptions = pgTable('customer_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  customerId:       uuid('customer_id').notNull().references(() => users.id),
  planId:           uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status:           subscriptionStatusEnum('status').default('active').notNull(),
  totalMeals:       integer('total_meals').notNull(),         // copied from plan at purchase time
  balanceRemaining: integer('balance_remaining').notNull(),   // decrements on each scan
  startsAt:         timestamp('starts_at').notNull(),
  expiresAt:        timestamp('expires_at').notNull(),
  autoRenew:        boolean('auto_renew').default(false).notNull(),
  qrSecret:         text('qr_secret').notNull(),              // TOTP secret for this subscription's QR
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  updatedAt:        timestamp('updated_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ one }) => ({
  tenant: one(tenants, { fields: [subscriptionPlans.tenantId], references: [tenants.id] }),
}));

export const customerSubscriptionsRelations = relations(customerSubscriptions, ({ one }) => ({
  tenant:   one(tenants,             { fields: [customerSubscriptions.tenantId],   references: [tenants.id] }),
  customer: one(users,               { fields: [customerSubscriptions.customerId], references: [users.id] }),
  plan:     one(subscriptionPlans,   { fields: [customerSubscriptions.planId],     references: [subscriptionPlans.id] }),
}));

export type SubscriptionPlan        = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan     = typeof subscriptionPlans.$inferInsert;
export type CustomerSubscription    = typeof customerSubscriptions.$inferSelect;
export type NewCustomerSubscription = typeof customerSubscriptions.$inferInsert;
