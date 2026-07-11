import {
  uuid,
  pgTable,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const deviceTypeEnum = pgEnum('device_type', ['POS', 'KDS']);
export const deviceStatusEnum = pgEnum('device_status', ['active', 'offline', 'revoked']);

export const devices = pgTable('devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  branchId: uuid('branch_id').notNull(), // Assuming branchId relates to a branch table if it existed, for now just a UUID
  name: text('name').notNull(),
  type: deviceTypeEnum('type').notNull().default('POS'),
  pairingCode: text('pairing_code'), // 6-digit code for initial setup
  pairingCodeExpiresAt: timestamp('pairing_code_expires_at'),
  status: deviceStatusEnum('status').notNull().default('offline'),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const devicesRelations = relations(devices, ({ one }) => ({
  tenant: one(tenants, { fields: [devices.tenantId], references: [tenants.id] }),
}));

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
