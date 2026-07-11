import {
  uuid,
  pgTable, pgEnum,
  text,
  boolean,
  timestamp,
  real,
  jsonb,
  uniqueIndex,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
export const branchStatusEnum = pgEnum('branchStatusEnum', ['ACTIVE', 'TEMPORARILY_CLOSED', 'PERMANENTLY_CLOSED']);


// ─── Table ──────────────────────────────────────────────────────────────────
export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  name:         text('name').notNull(),
  address:      text('address'),
  phone:        text('phone'),
  latitude:     real('latitude'),
  longitude:    real('longitude'),
  openingHours: jsonb('opening_hours'), // { mon: { open: "09:00", close: "22:00" }, ... }
  currency:     text('currency'), // Optional branch-level override
  status: branchStatusEnum('status').default('ACTIVE').notNull(),
  managerId:    uuid('manager_id'), // FK to users — set after users table exists
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at'),
}, (table) => ({
  unqTenantBranch: uniqueIndex('unq_branch_tenant_name').on(table.tenantId, table.name),
}));

// ─── Relations ──────────────────────────────────────────────────────────────
export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
}));

export type Branch    = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
