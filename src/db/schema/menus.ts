import {
  uuid,
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  time,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const menuItemAvailabilityEnum = pgEnum('menu_item_availability', [
  'always',       // available all the time
  'time_window',  // available between specific times
  'days',         // available on specific days
]);

// ─── Menu Categories ─────────────────────────────────────────────────────────
export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  name:      text('name').notNull(),
  imageUrl:  text('image_url'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive:  boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  unqTenantCategory: uniqueIndex('unq_cat_tenant_name').on(table.tenantId, table.name),
}));

// ─── Menu Items ──────────────────────────────────────────────────────────────
export const menuItems = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  categoryId:     uuid('category_id').notNull().references(() => menuCategories.id),
  name:           text('name').notNull(),
  description:    text('description'),
  price:          numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl:       text('image_url'),
  isVeg:          boolean('is_veg').default(true).notNull(),
  isJain:         boolean('is_jain').default(false).notNull(),
  isGlutenFree:   boolean('is_gluten_free').default(false).notNull(),
  spiceLevel:     integer('spice_level').default(0), // 0=none, 1=mild, 2=medium, 3=hot
  availability:   menuItemAvailabilityEnum('availability').default('always').notNull(),
  availableFrom:  time('available_from'),  // e.g. 11:00
  availableUntil: time('available_until'), // e.g. 15:00
  sortOrder:      integer('sort_order').default(0).notNull(),
  isActive:       boolean('is_active').default(true).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
  deletedAt:      timestamp('deleted_at'),
}, (table) => ({
  unqTenantCategoryItem: uniqueIndex('unq_item_tenant_cat_name').on(table.tenantId, table.categoryId, table.name),
}));

// ─── Menu Item Variants ───────────────────────────────────────────────────────
// e.g. Full / Half, Small / Medium / Large
export const menuItemVariants = pgTable('menu_item_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id),
  name:       text('name').notNull(),   // e.g. "Full Plate"
  priceDelta: numeric('price_delta', { precision: 10, scale: 2 }).default('0').notNull(), // added to base price
  isDefault:  boolean('is_default').default(false).notNull(),
});

// ─── Menu Item Add-ons ────────────────────────────────────────────────────────
// e.g. Extra Raita (+₹20), Extra Pickle (+₹10)
export const menuItemAddons = pgTable('menu_item_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:   uuid('tenant_id').notNull().references(() => tenants.id),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id), // null = global addon
  name:       text('name').notNull(),
  price:      numeric('price', { precision: 10, scale: 2 }).notNull(),
  isActive:   boolean('is_active').default(true).notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menuCategories.tenantId], references: [tenants.id] }),
  items:  many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, { fields: [menuItems.categoryId], references: [menuCategories.id] }),
  variants: many(menuItemVariants),
  addons:   many(menuItemAddons),
}));

export type MenuItem        = typeof menuItems.$inferSelect;
export type NewMenuItem     = typeof menuItems.$inferInsert;
export type MenuCategory    = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;
export type MenuItemAddon    = typeof menuItemAddons.$inferSelect;
export type NewMenuItemAddon = typeof menuItemAddons.$inferInsert;
