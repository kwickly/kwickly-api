import {
  uuid,
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

// ─── Table ──────────────────────────────────────────────────────────────────
// Stores a chronological ledger of all mutating actions (POST, PUT, PATCH, DELETE)
export const auditLogs = pgTable('audit_logs', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  userId:      uuid('user_id').notNull().references(() => users.id),
  userRole:    text('user_role'),         // Snapshot of the user role at mutation time
  method:      text('method').notNull(), // POST, PUT, DELETE, PATCH
  path:        text('path').notNull(),   // e.g., /api/menu/123
  payload:     jsonb('payload'),         // The request body that caused the mutation
  statusCode:  integer('status_code'),    // HTTP response status code
  ipAddress:   text('ip_address'),       
  userAgent:   text('user_agent'),        // Client device and browser info
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user:   one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export type AuditLog    = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
