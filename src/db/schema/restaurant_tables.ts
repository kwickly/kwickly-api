import {
  uuid,
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { branches } from './branches';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const tableStatusEnum = pgEnum('table_status', [
  'available',
  'occupied',
  'reserved',
  'cleaning',
]);

// ─── Restaurant Tables ────────────────────────────────────────────────────────
// Registered physical tables per branch. Each gets a unique qrToken embedded in QR sticker URL.
// tableId is permanent (baked into QR URL); qrToken can be rotated for security without
// breaking the permanent tableId reference on orders.
export const restaurantTables = pgTable('restaurant_tables', {
  id:               uuid('id').defaultRandom().primaryKey(),
  branchId:         uuid('branch_id').notNull().references(() => branches.id),
  name:             text('name').notNull(),             // "T1", "Patio 3", "Counter"
  capacity:         integer('capacity'),                // optional max covers
  status:           tableStatusEnum('status').default('available').notNull(),
  qrToken:          text('qr_token').notNull().unique(), // short random token e.g. "xk7p2"
  currentSessionId: uuid('current_session_id'),         // FK set after table_sessions exists
  sortOrder:        integer('sort_order').default(0).notNull(),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  updatedAt:        timestamp('updated_at').defaultNow().notNull(),
  deletedAt:        timestamp('deleted_at'),
}, (table) => ({
  idxBranch: index('idx_restaurant_tables_branch').on(table.branchId),
  idxQrToken: index('idx_restaurant_tables_qr_token').on(table.qrToken),
}));

// ─── Relations ───────────────────────────────────────────────────────────────
export const restaurantTablesRelations = relations(restaurantTables, ({ one }) => ({
  branch: one(branches, { fields: [restaurantTables.branchId], references: [branches.id] }),
}));

export type RestaurantTable    = typeof restaurantTables.$inferSelect;
export type NewRestaurantTable = typeof restaurantTables.$inferInsert;
