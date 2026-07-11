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
import { roles } from './rbac';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', [
  'platform_owner',
  'super_admin',
  'tenant_owner',
  'manager',
  'cashier',
  'kitchen_staff',
  'qr_scanner',
  'staff',
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
  roleId:      uuid('role_id').references(() => roles.id), // Dynamic custom roles
  posPin:      text('pos_pin'), // Hashed 4-digit PIN for fast POS login
  avatarUrl:   text('avatar_url'),
  isActive:    boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at'),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  rbacRole: one(roles, { fields: [users.roleId], references: [roles.id] }),
  passwordResetTokens: many(passwordResetTokens),
}));

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
