import {
  uuid,
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';
import { users } from './users';
import { menuItems, menuItemVariants, menuItemAddons } from './menus';
import { combos } from './combos';
import { customerSubscriptions } from './subscriptions';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const orderTypeEnum = pgEnum('order_type', [
  'subscription_redemption',  // deducted from meal balance
  'paid',                     // normal cash/UPI order
  'combo',                    // standalone combo purchase
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
]);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  branchId:       uuid('branch_id').notNull().references(() => branches.id),
  customerId:     uuid('customer_id').references(() => users.id),          // null for walk-in orders
  subscriptionId: uuid('subscription_id').references(() => customerSubscriptions.id), // for subscription_redemption
  type:           orderTypeEnum('type').notNull(),
  status:         orderStatusEnum('status').default('pending').notNull(),
  subtotal:       numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  total:          numeric('total', { precision: 10, scale: 2 }).notNull(),
  note:           text('note'),
  tableNumber:    text('table_number'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenantBranchCreated: index('idx_orders_tenant_branch_created').on(table.tenantId, table.branchId, table.createdAt),
}));

// ─── Order Items ─────────────────────────────────────────────────────────────
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId:     uuid('order_id').notNull().references(() => orders.id),
  menuItemId:  uuid('menu_item_id').references(() => menuItems.id),
  comboId:     uuid('combo_id').references(() => combos.id),
  variantId:   uuid('variant_id').references(() => menuItemVariants.id),
  addonId:     uuid('addon_id').references(() => menuItemAddons.id),
  name:        text('name').notNull(),    // snapshot name at order time
  quantity:    integer('quantity').default(1).notNull(),
  unitPrice:   numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total:       numeric('total', { precision: 10, scale: 2 }).notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant:       one(tenants,               { fields: [orders.tenantId],       references: [tenants.id] }),
  branch:       one(branches,              { fields: [orders.branchId],        references: [branches.id] }),
  customer:     one(users,                 { fields: [orders.customerId],      references: [users.id] }),
  subscription: one(customerSubscriptions, { fields: [orders.subscriptionId],  references: [customerSubscriptions.id] }),
  items:        many(orderItems),
}));

export type Order    = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
