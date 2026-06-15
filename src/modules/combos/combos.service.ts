import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index';
import { combos, comboItems } from '../../db/schema/combos';

export class CombosService {
  /**
   * Fetch all active combos for a branch (and tenant).
   */
  async getCombos(tenantId: string, branchId?: string) {
    // In a real scenario, you'd join with comboItems to get the full tree
    const conditions = [
      eq(combos.tenantId, tenantId),
      eq(combos.isActive, true),
      isNull(combos.deletedAt)
    ];

    if (branchId) {
      conditions.push(eq(combos.branchId, branchId));
    }

    return await db
      .select()
      .from(combos)
      .where(and(...conditions))
      .execute();
  }

  /**
   * Create a new combo bundle with its linked menu items.
   */
  async createCombo(tenantId: string, payload: {
    branchId?: string;
    name: string;
    description?: string;
    price: string;
    items: { menuItemId: string; quantity: number }[];
  }) {
    // We use a transaction because we need to insert the combo and its M2M items
    return await db.transaction(async (tx) => {
      const [newCombo] = await tx
        .insert(combos)
        .values({
          tenantId,
          branchId: payload.branchId || null,
          name: payload.name,
          description: payload.description,
          price: payload.price,
        })
        .returning();

      if (!newCombo) throw new Error('Failed to create combo');

      if (payload.items && payload.items.length > 0) {
        const comboItemsData = payload.items.map(item => ({
          comboId: newCombo.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        }));

        await tx.insert(comboItems).values(comboItemsData).execute();
      }

      return newCombo;
    });
  }
}
