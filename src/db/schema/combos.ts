import {
  uuid,
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  time,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { branches } from './branches';
import { menuItems } from './menus';

// ─── Combos ──────────────────────────────────────────────────────────────────
// A combo is a bundle of items offered at a discounted price
export const combos = pgTable('combos', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id),
  branchId:       uuid('branch_id').references(() => branches.id), // null = all branches
  name:           text('name').notNull(),
  description:    text('description'),
  imageUrl:       text('image_url'),
  price:          numeric('price', { precision: 10, scale: 2 }).notNull(),
  availableFrom:  time('available_from'),   // e.g. 11:00
  availableUntil: time('available_until'),  // e.g. 15:00
  isActive:       boolean('is_active').default(true).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
  deletedAt:      timestamp('deleted_at'),
});

// ─── Combo Items (M2M) ────────────────────────────────────────────────────────
export const comboItems = pgTable('combo_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  comboId:    uuid('combo_id').notNull().references(() => combos.id),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id),
  quantity:   integer('quantity').default(1).notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const combosRelations = relations(combos, ({ one, many }) => ({
  tenant: one(tenants, { fields: [combos.tenantId], references: [tenants.id] }),
  items:  many(comboItems),
}));

export const comboItemsRelations = relations(comboItems, ({ one }) => ({
  combo:    one(combos,     { fields: [comboItems.comboId],    references: [combos.id] }),
  menuItem: one(menuItems,  { fields: [comboItems.menuItemId], references: [menuItems.id] }),
}));

export type Combo    = typeof combos.$inferSelect;
export type NewCombo = typeof combos.$inferInsert;
