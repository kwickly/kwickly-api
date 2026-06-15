import { eq, and, isNull, sum } from 'drizzle-orm';
import { db } from '../../db/index';
import { rawMaterials, recipes, stockLedgers } from '../../db/schema/inventory';

export class InventoryService {
  /**
   * Fetch raw materials
   */
  async getMaterials(tenantId: string) {
    return await db
      .select()
      .from(rawMaterials)
      .where(and(eq(rawMaterials.tenantId, tenantId), isNull(rawMaterials.deletedAt)))
      .execute();
  }

  /**
   * Add raw material
   */
  async addMaterial(tenantId: string, payload: { name: string; uom: 'KG' | 'GRAM' | 'LITER' | 'MILLILITER' | 'PIECE' | 'BOX' }) {
    const [material] = await db
      .insert(rawMaterials)
      .values({
        tenantId,
        name: payload.name,
        uom: payload.uom,
      })
      .returning();
    return material;
  }

  /**
   * Get current stock aggregated from ledgers
   */
  async getStock(tenantId: string, branchId: string) {
    // Note: In real world, doing SUM across huge ledgers should be materialized.
    const result = await db
      .select({
        rawMaterialId: stockLedgers.rawMaterialId,
        totalStock: sum(stockLedgers.quantityChange)
      })
      .from(stockLedgers)
      .where(and(eq(stockLedgers.tenantId, tenantId), eq(stockLedgers.branchId, branchId)))
      .groupBy(stockLedgers.rawMaterialId)
      .execute();

    return result;
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(tenantId: string, branchId: string, payload: {
    rawMaterialId: string;
    quantityChange: string;
    reason: string;
  }) {
    const [ledger] = await db
      .insert(stockLedgers)
      .values({
        tenantId,
        branchId,
        rawMaterialId: payload.rawMaterialId,
        quantityChange: payload.quantityChange,
        reason: payload.reason,
      })
      .returning();
    return ledger;
  }

  /**
   * Add a recipe relation (BOM)
   */
  async linkRecipe(payload: {
    menuItemId: string;
    rawMaterialId: string;
    quantityRequired: string;
  }) {
    const [recipe] = await db
      .insert(recipes)
      .values({
        menuItemId: payload.menuItemId,
        rawMaterialId: payload.rawMaterialId,
        quantityRequired: payload.quantityRequired,
      })
      .returning();
    return recipe;
  }
}
