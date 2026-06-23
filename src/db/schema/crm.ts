import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  decimal,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { users } from './users.ts';

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Customer profiles for marketing, CRM, and tracking Lifetime Value
 */
export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dateOfBirth: timestamp('date_of_birth'),
  anniversaryDate: timestamp('anniversary_date'),
  marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),
  lifetimeValue: decimal('lifetime_value', { precision: 12, scale: 2 }).default('0').notNull(),
  walletBalance: decimal('wallet_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure a user only has ONE marketing profile per restaurant tenant
  unqTenantUser: uniqueIndex('unq_cust_prof_tenant_user').on(table.tenantId, table.userId),
}));

export const walletTransactionTypeEnum = pgEnum('wallet_transaction_type', [
  'CREDIT',
  'DEBIT',
]);

/**
 * Double-entry ledger tracking customer wallet balance (real money equivalents)
 */
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id'), // Nullable
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  type: walletTransactionTypeEnum('type').notNull(),
  reason: text('reason').notNull(), // e.g., "Refund for Order #123", "Wallet Top-up"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Double-entry ledger tracking customer loyalty points
 */
export const loyaltyLedgers = pgTable('loyalty_ledgers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id'), // Nullable because points could be given manually (e.g. Birthday bonus)
  points: decimal('points', { precision: 10, scale: 2 }).notNull(), // Positive (earned) or Negative (redeemed)
  reason: text('reason').notNull(), // e.g., "Order #123", "Redemption on Order #124", "Sign-up Bonus"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customerProfiles.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
}));

export const loyaltyLedgersRelations = relations(loyaltyLedgers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [loyaltyLedgers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [loyaltyLedgers.userId],
    references: [users.id],
  }),
  // order: one(orders, { ... }) // Will link to orders later
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [walletTransactions.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
}));

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;

export type LoyaltyLedger = typeof loyaltyLedgers.$inferSelect;
export type NewLoyaltyLedger = typeof loyaltyLedgers.$inferInsert;

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
