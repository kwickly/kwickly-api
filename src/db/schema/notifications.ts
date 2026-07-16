import {
  uuid,
  pgTable,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { users } from './users.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const notificationChannelEnum = pgEnum('notification_channel', [
  'PUSH',
  'WHATSAPP',
  'EMAIL',
  'SMS',
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'PENDING',
  'SENT',
  'FAILED',
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Reusable templates for notifications
 */
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g., "Welcome Email", "OTP Message"
  channel: notificationChannelEnum('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull(), // Supports Handlebars-style variables: {{name}}
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_notificationTemplates_tenant_id').on(table.tenantId),
}));

/**
 * Audit log of all sent notifications
 */
export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channel: notificationChannelEnum('channel').notNull(),
  status: notificationStatusEnum('status').default('PENDING').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  metadata: jsonb('metadata'), // Stores error details or provider-specific IDs
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_notificationLogs_tenant_id').on(table.tenantId),
}));

// ─── Relations ──────────────────────────────────────────────────────────────
export const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notificationTemplates.tenantId],
    references: [tenants.id],
  }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notificationLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notificationLogs.userId],
    references: [users.id],
  }),
}));

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * FCM Device Tokens for Push Notifications
 */
export const fcmTokens = pgTable('fcm_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  deviceType: text('device_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_fcmTokens_tenant_id').on(table.tenantId),
  idxUser: index('idx_fcmTokens_user_id').on(table.userId),
}));

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  tenant: one(tenants, {
    fields: [fcmTokens.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [fcmTokens.userId],
    references: [users.id],
  }),
}));

export type FcmToken = typeof fcmTokens.$inferSelect;
export type NewFcmToken = typeof fcmTokens.$inferInsert;
