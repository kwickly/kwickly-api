import {
  uuid,
  pgTable,
  timestamp,
  integer,
  numeric,
  text,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';

// ─── Tenant Billing Meters Table ─────────────────────────────────────────────
// Keeps track of consumption metrics (orders, SMS, seats, devices) per monthly billing period.
export const tenantBillingMeters = pgTable('tenant_billing_meters', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
  orderCount: integer('order_count').default(0).notNull(),
  smsCount: integer('sms_count').default(0).notNull(),
  activeStaffCount: integer('active_staff_count').default(0).notNull(),
  activeDeviceCount: integer('active_device_count').default(0).notNull(),
  amountDue: numeric('amount_due', { precision: 10, scale: 2 }).default('0.00').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'INVOICED' | 'PAID'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_tenantBillingMeters_tenant_id').on(table.tenantId),
}));

// ─── Relations ──────────────────────────────────────────────────────────────
export const tenantBillingMetersRelations = relations(tenantBillingMeters, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantBillingMeters.tenantId],
    references: [tenants.id],
  }),
}));

export type TenantBillingMeter = typeof tenantBillingMeters.$inferSelect;
export type NewTenantBillingMeter = typeof tenantBillingMeters.$inferInsert;
