import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'tenant_owner',
  'manager',
  'cashier',
  'kitchen_staff',
  'qr_scanner',
  'customer',
]);

// ─── Table ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:    uuid('tenant_id').references(() => tenants.id), // null for super_admin
  branchId:    uuid('branch_id'), // FK to branches — optional, some staff are tenant-wide
  name:        text('name').notNull(),
  phone:       text('phone').unique(),
  email:       text('email').unique(),
  password:    text('password'), // Hashed password for staff login
  role:        userRoleEnum('role').notNull().default('customer'),
  avatarUrl:   text('avatar_url'),
  isActive:    boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at'),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
