import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';
import { users } from './users';
import { customerSubscriptions } from './subscriptions';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const attendanceMealTypeEnum = pgEnum('attendance_meal_type', ['lunch', 'dinner']);

// ─── Attendance Logs ─────────────────────────────────────────────────────────
// One record per successful QR scan
export const attendanceLogs = pgTable('attendance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull().references(() => customerSubscriptions.id),
  customerId:     uuid('customer_id').notNull().references(() => users.id),
  branchId:       uuid('branch_id').notNull().references(() => branches.id),
  staffId:        uuid('staff_id').references(() => users.id),    // who scanned (null if kiosk mode)
  mealType:       attendanceMealTypeEnum('meal_type').notNull(),
  scannedAt:      timestamp('scanned_at').notNull(),              // actual scan time (client side — important for offline sync)
  syncedAt:       timestamp('synced_at').defaultNow().notNull(),  // when it hit the server
  isOfflineSync:  boolean('is_offline_sync').default(false).notNull(), // was this scanned offline and synced later?
  deviceId:       uuid('device_id'),                              // for fraud/audit tracking
  note:           text('note'),                                   // optional staff note,
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_attendanceLogs_tenant_id').on(table.tenantId),
}));

// ─── Relations ───────────────────────────────────────────────────────────────
export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  tenant:       one(tenants,               { fields: [attendanceLogs.tenantId],       references: [tenants.id] }),
  subscription: one(customerSubscriptions, { fields: [attendanceLogs.subscriptionId], references: [customerSubscriptions.id] }),
  customer:     one(users,                 { fields: [attendanceLogs.customerId],      references: [users.id] }),
  branch:       one(branches,              { fields: [attendanceLogs.branchId],        references: [branches.id] }),
  staff:        one(users,                 { fields: [attendanceLogs.staffId],         references: [users.id] }),
}));

export type AttendanceLog    = typeof attendanceLogs.$inferSelect;
export type NewAttendanceLog = typeof attendanceLogs.$inferInsert;
