import {
  uuid,
  pgTable,
  text,
  timestamp,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.ts';
import { branches } from './branches.ts';
import { menuItems } from './menus.ts';

// ─── Enums ──────────────────────────────────────────────────────────────────
export const unitOfMeasurementEnum = pgEnum('unit_of_measurement', [
  'KG',
  'GRAM',
  'LITER',
  'MILLILITER',
  'PIECE',
  'BOX',
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Suppliers / Vendors for raw materials
 */
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  gstNumber: text('gst_number'),
  taxId: text('tax_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


/**
 * Raw Materials purchased by the restaurant
 */
export const rawMaterials = pgTable('raw_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "Flour", "Tomatoes"
  uom: unitOfMeasurementEnum('uom').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Recipes linking Menu Items to Raw Materials
 */
export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menuItems.id, { onDelete: 'cascade' }),
  rawMaterialId: uuid('raw_material_id')
    .notNull()
    .references(() => rawMaterials.id, { onDelete: 'cascade' }),
  quantityRequired: decimal('quantity_required', { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Double-entry ledger for tracking per-branch inventory stock levels
 */
export const stockLedgers = pgTable('stock_ledgers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }), // Strict per-branch inventory
  rawMaterialId: uuid('raw_material_id')
    .notNull()
    .references(() => rawMaterials.id, { onDelete: 'cascade' }),
  quantityChange: decimal('quantity_change', { precision: 12, scale: 4 }).notNull(), // Positive (Added) or Negative (Consumed/Spoiled)
  reason: text('reason').notNull(), // e.g. "Purchase", "Spoilage", "Transfer IN", "Consumed in Order #123"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const rawMaterialsRelations = relations(rawMaterials, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rawMaterials.tenantId],
    references: [tenants.id],
  }),
  recipes: many(recipes),
  stockLedgers: many(stockLedgers),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [recipes.menuItemId],
    references: [menuItems.id],
  }),
  rawMaterial: one(rawMaterials, {
    fields: [recipes.rawMaterialId],
    references: [rawMaterials.id],
  }),
}));

export const stockLedgersRelations = relations(stockLedgers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stockLedgers.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [stockLedgers.branchId],
    references: [branches.id],
  }),
  rawMaterial: one(rawMaterials, {
    fields: [stockLedgers.rawMaterialId],
    references: [rawMaterials.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
}));

export type RawMaterial = typeof rawMaterials.$inferSelect;
export type NewRawMaterial = typeof rawMaterials.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type StockLedger = typeof stockLedgers.$inferSelect;
export type NewStockLedger = typeof stockLedgers.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
