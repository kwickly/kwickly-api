import {
  uuid,
  pgTable,
  text,
  timestamp,
  decimal,
  pgEnum,
  uniqueIndex,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { branches } from './branches.ts';
import { users } from './users.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const salaryTypeEnum = pgEnum('salary_type', ['HOURLY', 'MONTHLY']);
export const leaveTypeEnum = pgEnum('leave_type', ['SICK', 'VACATION', 'UNPAID']);
export const approvalStatusEnum = pgEnum('approval_status', ['PENDING', 'APPROVED', 'REJECTED']);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Staff Profiles handling HR details and Digital Identity
 */
export const staffProfiles = pgTable('staff_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emergencyContact: text('emergency_contact'),
  joiningDate: date('joining_date').notNull(),
  salaryType: salaryTypeEnum('salary_type').notNull(),
  baseSalary: decimal('base_salary', { precision: 12, scale: 2 }), // For MONTHLY
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }), // For HOURLY
  digitalIdToken: text('digital_id_token').unique().notNull(), // QR Code token
  digitalIdUrl: text('digital_id_url'), // Public URL to view verification
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // A global user can only have ONE staff profile per restaurant
  unqTenantStaff: uniqueIndex('unq_hr_prof_tenant_user').on(table.tenantId, table.userId),
}));

/**
 * Staff Attendance (Clock Ins/Outs)
 */
export const staffAttendance = pgTable('staff_attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clockInAt: timestamp('clock_in_at').notNull(),
  clockOutAt: timestamp('clock_out_at'),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }), // Computed dynamically upon clock out
});

/**
 * Staff Leaves
 */
export const staffLeaves = pgTable('staff_leaves', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: approvalStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Public Holidays
 */
export const publicHolidays = pgTable('public_holidays', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueHoliday: uniqueIndex('unique_tenant_holiday').on(table.tenantId, table.date),
}));

// ─── Relations ──────────────────────────────────────────────────────────────
export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  tenant: one(tenants, { fields: [staffProfiles.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [staffProfiles.userId], references: [users.id] }),
}));

export const staffAttendanceRelations = relations(staffAttendance, ({ one }) => ({
  tenant: one(tenants, { fields: [staffAttendance.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [staffAttendance.branchId], references: [branches.id] }),
  staff: one(users, { fields: [staffAttendance.staffId], references: [users.id] }),
}));

export const staffLeavesRelations = relations(staffLeaves, ({ one }) => ({
  tenant: one(tenants, { fields: [staffLeaves.tenantId], references: [tenants.id] }),
  staff: one(users, { fields: [staffLeaves.staffId], references: [users.id] }),
}));
