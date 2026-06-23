import {
  uuid,
  pgTable,
  timestamp,
  decimal,
  pgEnum,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { users } from './users.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const payrollStatusEnum = pgEnum('payroll_status', ['DRAFT', 'PROCESSED', 'PAID']);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Payroll Runs (Master record for a pay period)
 */
export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  periodStartDate: date('period_start_date').notNull(),
  periodEndDate: date('period_end_date').notNull(),
  status: payrollStatusEnum('status').default('DRAFT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniquePeriod: uniqueIndex('unique_payroll_period').on(table.tenantId, table.periodStartDate, table.periodEndDate),
}));

/**
 * Salary Slips (Individual staff payslips for a payroll run)
 */
export const salarySlips = pgTable('salary_slips', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  payrollRunId: uuid('payroll_run_id')
    .notNull()
    .references(() => payrollRuns.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  baseAmount: decimal('base_amount', { precision: 12, scale: 2 }).notNull(), // Base salary OR Total Hours * Hourly Rate
  overtimeAmount: decimal('overtime_amount', { precision: 10, scale: 2 }).default('0'),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0'), // Unpaid leaves
  bonus: decimal('bonus', { precision: 10, scale: 2 }).default('0'),
  netPayable: decimal('net_payable', { precision: 12, scale: 2 }).notNull(), // (Base + Overtime + Bonus) - Deductions
  status: payrollStatusEnum('status').default('DRAFT').notNull(), // Can be PAID individually
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSlip: uniqueIndex('unique_salary_slip').on(table.payrollRunId, table.staffId),
}));

// ─── Relations ──────────────────────────────────────────────────────────────
export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [payrollRuns.tenantId], references: [tenants.id] }),
  slips: many(salarySlips),
}));

export const salarySlipsRelations = relations(salarySlips, ({ one }) => ({
  tenant: one(tenants, { fields: [salarySlips.tenantId], references: [tenants.id] }),
  payrollRun: one(payrollRuns, { fields: [salarySlips.payrollRunId], references: [payrollRuns.id] }),
  staff: one(users, { fields: [salarySlips.staffId], references: [users.id] }),
}));
