import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  numeric,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { branches } from './branches.ts';
import { users } from './users.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const tenantPlanEnum = pgEnum('tenant_plan', [
  'FREE',
  'BASIC',
  'STARTER',
  'GROWTH',
  'ENTERPRISE',
  'CUSTOM',
]);

export const tenantStatusEnum = pgEnum('tenant_status', [
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
]);

export const dietaryTypeEnum = pgEnum('dietary_type', [
  'PURE_VEG',
  'VEG_AND_NON_VEG',
  'VEGAN',
  'CUSTOM',
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
  plan:        tenantPlanEnum('plan').default('BASIC').notNull(),
  status:      tenantStatusEnum('status').default('ACTIVE').notNull(),
  dietaryType: dietaryTypeEnum('dietary_type').default('VEG_AND_NON_VEG').notNull(),
  billingModel: text('billing_model').default('FLAT').notNull(), // 'FLAT' | 'METERED'
  baseFee:      numeric('base_fee', { precision: 10, scale: 2 }).default('499.00').notNull(),
  customOrderRate: numeric('custom_order_rate', { precision: 10, scale: 2 }),
  maxOrdersPerMonth: integer('max_orders_per_month').default(100).notNull(),
  maxTables: integer('max_tables').default(10).notNull(), // plan-gated: FREE=0, BASIC=10, STARTER=25, GROWTH=75, ENTERPRISE=9999
  allowTakeawayOnDineIn: boolean('allow_takeaway_on_dine_in').default(false).notNull(),
  defaultPreparationTime: integer('default_preparation_time').default(20).notNull(), // minutes
  enabledAddons: jsonb('enabled_addons').$type<{
    inventory: boolean;
    payroll: boolean;
    crm: boolean;
    ai: boolean;
  }>().default({ inventory: false, payroll: false, crm: false, ai: false }).notNull(),
  annualPaidLeaveLimit: text('annual_paid_leave_limit').default('15').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  suspendedAt: timestamp('suspended_at'),
  terminatedAt: timestamp('terminated_at'),
  deletedAt:   timestamp('deleted_at'), // soft delete
});

// ─── Tenant Brandings (White Label) ─────────────────────────────────────────
export const tenantBrandings = pgTable('tenant_brandings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }).unique(),
  brandColor: text('brand_color').default('#EE3B2B').notNull(),
  brandColorSecondary: text('brand_color_secondary'),
  borderRadius: text('border_radius').default('0.5rem').notNull(),
  logoUrl: text('logo_url'),
  logoMetadata: jsonb('logo_metadata').$type<{
    provider: 'cloudinary' | 'r2' | 's3';
    publicId: string;
    format?: string;
    bytes?: number;
  }>(),
  logoDarkUrl: text('logo_dark_url'),
  logoDarkMetadata: jsonb('logo_dark_metadata').$type<{
    provider: 'cloudinary' | 'r2' | 's3';
    publicId: string;
    format?: string;
    bytes?: number;
  }>(),
  faviconUrl: text('favicon_url'),
  faviconMetadata: jsonb('favicon_metadata').$type<{
    provider: 'cloudinary' | 'r2' | 's3';
    publicId: string;
    format?: string;
    bytes?: number;
  }>(),
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
  enabledModules: jsonb('enabled_modules').$type<{
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
    subscriptions: boolean;
  }>().default({ dineIn: true, takeaway: false, delivery: false, subscriptions: false }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // soft delete
}, (table) => ({
  idxTenant: index('idx_tenantBrandings_tenant_id').on(table.tenantId),
}));

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
