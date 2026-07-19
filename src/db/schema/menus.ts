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
  index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';
export const menuItemStatusEnum = pgEnum('menu_item_status', ['AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN']);


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
  status: menuItemStatusEnum('status').default('AVAILABLE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
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

  // ── Dietary flags ────────────────────────────────────────────────────────
  isVeg:          boolean('is_veg').default(true).notNull(),
  isJain:         boolean('is_jain').default(false).notNull(),
  isGlutenFree:   boolean('is_gluten_free').default(false).notNull(),
  spiceLevel:     integer('spice_level').default(0), // 0=none, 1=mild, 2=medium, 3=hot

  // ── Badge / tag flags (manual, set by restaurant admin) ──────────────────
  // Priority for display: bestseller > chefSpecial > restaurantSpecial >
  //                       new > popular > limitedEdition > healthyChoice
  // Max 2 badges shown per item in the storefront.
  // Future: isBestseller + isPopular will be auto-computed from order analytics.
  isBestseller:        boolean('is_bestseller').default(false).notNull(),
  isChefSpecial:       boolean('is_chef_special').default(false).notNull(),
  isRestaurantSpecial: boolean('is_restaurant_special').default(false).notNull(),
  isNew:               boolean('is_new').default(false).notNull(),
  isPopular:           boolean('is_popular').default(false).notNull(),
  isLimitedEdition:    boolean('is_limited_edition').default(false).notNull(),
  isHealthyChoice:     boolean('is_healthy_choice').default(false).notNull(),

  // ── Nutrition info (optional; all nullable) ───────────────────────────────
  // FSSAI recommends calorie disclosure for restaurant menus.
  // If calories is null, the storefront hides the nutrition row entirely.
  calories:     integer('calories'),                           // kcal per serving
  servingSize:  text('serving_size'),                          // e.g. "1 plate (350g)"
  ingredients:  text('ingredients').array(),                   // ['chickpeas', 'tomato', ...]
  allergens:    text('allergens').array(),                     // ['dairy', 'gluten', 'nuts', ...]
  protein:      numeric('protein',  { precision: 5, scale: 1 }), // grams per serving
  carbs:        numeric('carbs',    { precision: 5, scale: 1 }), // grams per serving
  fat:          numeric('fat',      { precision: 5, scale: 1 }), // grams per serving

  // ── Availability ──────────────────────────────────────────────────────────
  availability:   menuItemAvailabilityEnum('availability').default('always').notNull(),
  availableFrom:  time('available_from'),   // e.g. "11:00" — used with time_window
  availableUntil: time('available_until'),  // e.g. "15:00" — used with time_window
  // Array of lowercase day names: ['monday','tuesday',...] — null means all days
  availableDays:  text('available_days').array(),
  // Hard expiry date for seasonal/limited-edition items.
  // Storefront shows item as unavailable after this date.
  availableUntilDate: text('available_until_date'), // ISO date string YYYY-MM-DD

  sortOrder:      integer('sort_order').default(0).notNull(),
  status: menuItemStatusEnum('status').default('AVAILABLE').notNull(),
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
  deletedAt: timestamp('deleted_at'),
});

// ─── Menu Item Add-ons ────────────────────────────────────────────────────────
// e.g. Extra Raita (+₹20), Extra Pickle (+₹10)
export const menuItemAddons = pgTable('menu_item_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:   uuid('tenant_id').notNull().references(() => tenants.id),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id), // null = global addon
  name:       text('name').notNull(),
  price:      numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: menuItemStatusEnum('status').default('AVAILABLE').notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  idxTenant: index('idx_menuItemAddons_tenant_id').on(table.tenantId),
}));

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
export type MenuItemVariant    = typeof menuItemVariants.$inferSelect;
export type NewMenuItemVariant = typeof menuItemVariants.$inferInsert;
