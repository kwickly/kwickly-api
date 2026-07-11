import {
  uuid,
  pgTable, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { branches } from './branches';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const kotStatusEnum = pgEnum('kot_status', [
  'pending',
  'preparing',
  'ready',
  'completed',
]);

// ─── Kitchen Order Tickets ────────────────────────────────────────────────────
// One KOT per order — pushed to KDS via SSE when an order is accepted
export const kots = pgTable('kots', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId:     uuid('order_id').notNull().references(() => orders.id),
  branchId:    uuid('branch_id').notNull().references(() => branches.id),
  status:      kotStatusEnum('status').default('pending').notNull(),
  printedAt:   timestamp('printed_at'),   // null until staff prints the KOT slip
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxBranchCreated: index('idx_kots_branch_created').on(table.branchId, table.createdAt),
}));

// ─── Relations ───────────────────────────────────────────────────────────────
export const kotsRelations = relations(kots, ({ one }) => ({
  order:  one(orders,   { fields: [kots.orderId],   references: [orders.id] }),
  branch: one(branches, { fields: [kots.branchId],  references: [branches.id] }),
}));

export type KOT    = typeof kots.$inferSelect;
export type NewKOT = typeof kots.$inferInsert;
