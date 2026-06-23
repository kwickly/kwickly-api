import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  numeric,
  text
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { branches } from './branches.ts';
import { users } from './users.ts';

export const timesheetStatusEnum = pgEnum('timesheet_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const timesheets = pgTable('timesheets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id), // Nullable for platform staff
  branchId: uuid('branch_id').references(() => branches.id), // Nullable for platform staff
  staffId: uuid('staff_id').notNull().references(() => users.id),
  
  clockIn: timestamp('clock_in').notNull(),
  clockOut: timestamp('clock_out'),
  totalHours: numeric('total_hours', { precision: 5, scale: 2 }), // e.g. 8.50
  
  status: timesheetStatusEnum('status').default('PENDING').notNull(),
  
  reviewedBy: uuid('reviewed_by').references(() => users.id), // Admin who approved/rejected
  reviewerNotes: text('reviewer_notes'), // Reason for rejection or approval note
  reviewedAt: timestamp('reviewed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  tenant: one(tenants, { fields: [timesheets.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [timesheets.branchId], references: [branches.id] }),
  staff: one(users, { fields: [timesheets.staffId], references: [users.id], relationName: 'staffTimesheets' }),
  reviewer: one(users, { fields: [timesheets.reviewedBy], references: [users.id], relationName: 'reviewedTimesheets' }),
}));

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
