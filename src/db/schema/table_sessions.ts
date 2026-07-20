import {
  uuid,
  pgTable,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { branches } from './branches';
import { restaurantTables } from './restaurant_tables';
import { orders } from './orders';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const sessionStatusEnum = pgEnum('session_status', [
  'open',
  'closed',
]);

// ─── Table Sessions ───────────────────────────────────────────────────────────
// One open session per occupied table. Owns a single master order for the entire
// sitting. Each round of ordering (customer adds more items) increments kotRound
// and creates a new KOT, while items append to the SAME master order for billing.
export const tableSessions = pgTable('table_sessions', {
  id:        uuid('id').defaultRandom().primaryKey(),
  tableId:   uuid('table_id').notNull().references(() => restaurantTables.id),
  branchId:  uuid('branch_id').notNull().references(() => branches.id),
  orderId:   uuid('order_id').notNull().references(() => orders.id),
  kotRound:  integer('kot_round').default(1).notNull(), // incremented per add-items call
  status:    sessionStatusEnum('status').default('open').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt:   timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTableOpen:  index('idx_table_sessions_table').on(table.tableId),
  idxBranchOpen: index('idx_table_sessions_branch').on(table.branchId, table.status),
}));

// ─── Relations ───────────────────────────────────────────────────────────────
export const tableSessionsRelations = relations(tableSessions, ({ one }) => ({
  table:  one(restaurantTables, { fields: [tableSessions.tableId],  references: [restaurantTables.id] }),
  branch: one(branches,         { fields: [tableSessions.branchId], references: [branches.id] }),
  order:  one(orders,           { fields: [tableSessions.orderId],  references: [orders.id] }),
}));

export type TableSession    = typeof tableSessions.$inferSelect;
export type NewTableSession = typeof tableSessions.$inferInsert;
