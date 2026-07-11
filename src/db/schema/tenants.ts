import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { branches } from './branches.ts';
import { users } from './users.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const tenantPlanEnum = pgEnum('tenant_plan', [
  'FREE',
  'STARTER',
  'GROWTH',
  'ENTERPRISE',
]);

// ─── Tenants Table ────────────────────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name:        text('name').notNull(),
  slug:        text('slug').notNull().unique(), // subdomain: swamy.kwickly.com
  phone:       text('phone'),
  email:       text('email'),
  address:     text('address'),
  baseCurrency: text('base_currency').default('INR').notNull(),
  plan:        tenantPlanEnum('plan').default('FREE').notNull(),
  isActive:    boolean('is_active').default(true).notNull(),
  annualPaidLeaveLimit: text('annual_paid_leave_limit').default('15').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at'), // soft delete
});

// ─── Tenant Brandings (White Label) ─────────────────────────────────────────
export const tenantBrandings = pgTable('tenant_brandings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }).unique(),
  brandColor: text('brand_color').default('#4f46e5').notNull(),
  logoUrl: text('logo_url'),
  logoDarkUrl: text('logo_dark_url'),
  faviconUrl: text('favicon_url'),
  themeMode: text('theme_mode').default('system').notNull(), // 'system' | 'light' | 'dark'
  themeConfig: jsonb('theme_config').$type<{
    light: Record<string, string>;
    dark: Record<string, string>;
    fonts: { sans: string; serif: string; mono: string; };
  }>().default({ light: {}, dark: {}, fonts: { sans: "Open Sans, sans-serif", serif: "Georgia, serif", mono: "Menlo, monospace" } }),
  
  // White Label Columns (Optional / Configured by Platform Admin)
  customDomain: text('custom_domain').unique(),
  customEmailSender: text('custom_email_sender'),
  hideKwicklyBranding: boolean('hide_kwickly_branding').default(false).notNull(),
  customPwaManifest: jsonb('custom_pwa_manifest'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  branches: many(branches),
  users:    many(users),
  branding: one(tenantBrandings, {
    fields: [tenants.id],
    references: [tenantBrandings.tenantId],
  }),
}));

export const tenantBrandingsRelations = relations(tenantBrandings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantBrandings.tenantId],
    references: [tenants.id],
  }),
}));

export type Tenant    = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantBranding    = typeof tenantBrandings.$inferSelect;
export type NewTenantBranding = typeof tenantBrandings.$inferInsert;
