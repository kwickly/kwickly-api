import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';

// ─── Roles ───────────────────────────────────────────────────────────────────
// Pre-seeded roles. Custom roles can be added per tenant in future.
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:  uuid('tenant_id').references(() => tenants.id), // null for system roles
  name:      text('name').notNull(),       // e.g. "Kitchen Staff"
  slug:      text('slug').notNull(),       // e.g. "kitchen_staff"
  isSystem:  boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSlugTenant: uniqueIndex('unique_role_slug_tenant').on(table.slug, table.tenantId),
}));

// ─── Permissions ─────────────────────────────────────────────────────────────
// Granular permission tokens checked by the RBAC middleware
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name:        text('name').notNull(),        // e.g. "Manage Menu"
  slug:        text('slug').notNull().unique(), // e.g. "menu:write"
  description: text('description'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// ─── Role ↔ Permissions (M2M) ────────────────────────────────────────────────
export const rolePermissions = pgTable('role_permissions', {
  roleId:       uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// ─── Relations ───────────────────────────────────────────────────────────────
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export type Role       = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
