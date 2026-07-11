import {
  uuid,
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { customerSubscriptions } from './subscriptions';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'razorpay',
  'cash',
  'upi',
  'wallet',      // internal wallet (Phase 3)
]);

// ─── Payments ────────────────────────────────────────────────────────────────
// Immutable ledger — never update, only insert
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId:          uuid('order_id').references(() => orders.id),
  subscriptionId:   uuid('subscription_id').references(() => customerSubscriptions.id), // for plan purchases
  razorpayOrderId:  uuid('razorpay_order_id').unique(),
  razorpayPaymentId:uuid('razorpay_payment_id').unique(),
  method:           paymentMethodEnum('method').notNull(),
  amount:           numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency:         text('currency').default('INR').notNull(),
  status:           paymentStatusEnum('status').default('pending').notNull(),
  refundAmount:     numeric('refund_amount', { precision: 10, scale: 2 }),
  failureReason:    text('failure_reason'),
  paidAt:           timestamp('paid_at'),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  order:        one(orders,               { fields: [payments.orderId],        references: [orders.id] }),
  subscription: one(customerSubscriptions,{ fields: [payments.subscriptionId], references: [customerSubscriptions.id] }),
}));

export type Payment    = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
