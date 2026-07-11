import { promotionStatusEnum } from './promotions';
import {
  uuid,
  pgTable, pgEnum,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { branches } from './branches.ts';
// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * In-App Advertisement banners
 */
export const inAppAds = pgTable('in_app_ads', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' }), // Nullable = All branches
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  link: text('link'),
  activeFrom: timestamp('active_from').defaultNow().notNull(),
  activeUntil: timestamp('active_until'),
  status: promotionStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_inAppAds_tenant_id').on(table.tenantId),
}));

/**
 * Tracking for Ad Impressions and Clicks
 */
export const adImpressions = pgTable('ad_impressions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adId: uuid('ad_id')
    .notNull()
    .references(() => inAppAds.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'), // Nullable for anonymous views
  clickedAt: timestamp('clicked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const inAppAdsRelations = relations(inAppAds, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [inAppAds.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [inAppAds.branchId],
    references: [branches.id],
  }),
  impressions: many(adImpressions),
}));

export const adImpressionsRelations = relations(adImpressions, ({ one }) => ({
  ad: one(inAppAds, {
    fields: [adImpressions.adId],
    references: [inAppAds.id],
  }),
}));

export type InAppAd = typeof inAppAds.$inferSelect;
export type NewInAppAd = typeof inAppAds.$inferInsert;
