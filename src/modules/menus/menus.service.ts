import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db';
import type { NewMenuCategory, NewMenuItem, NewMenuItemAddon } from '../../db/schema/menus';
import { menuCategories, menuItems, menuItemAddons } from '../../db/schema/menus';
import { withCache, redis } from '../../shared/redis';

/**
 * Service handling all core business logic for the Restaurant Menus.
 * Responsible for Categories, Items, and aggressive Redis caching of the menu tree.
 */
export class MenusService {
  /**
   * Fetches the fully nested menu tree (Categories -> Items) for a specific branch.
   * This method utilizes the Cache-Aside pattern via Redis (`withCache`) for ultra-fast customer-facing reads.
   * 
   * @param {string} tenantId - The UUID of the tenant.
   * @param {string} branchId - The UUID of the specific branch.
   * @returns {Promise<Array<MenuCategory & { items: MenuItem[] }>>} A promise resolving to the nested menu tree.
   */
  async getMenu(tenantId: string, branchId: string) {
    const cacheKey = `menu:tenant:${tenantId}:branch:${branchId}`;

    return withCache(cacheKey, async () => {
      // 1. Fetch categories
      const categories = await db.select()
        .from(menuCategories)
        .where(
          and(
            eq(menuCategories.tenantId, tenantId),
            // Either global categories or specific to this branch
            // In a real app we might use 'or' logic, for simplicity we assume global here
            eq(menuCategories.isActive, true)
          )
        );

      // 2. Fetch items
      const items = await db.select()
        .from(menuItems)
        .where(
          and(
            eq(menuItems.tenantId, tenantId),
            eq(menuItems.isActive, true),
            isNull(menuItems.deletedAt)
          )
        );

      // 3. Assemble nested structure
      return categories.map(category => ({
        ...category,
        items: items.filter(i => i.categoryId === category.id)
      }));
    }, 24 * 3600); // Cache for 24 hours
  }

  /**
   * Creates a new Menu Category for the tenant.
   *
   * @param {string} tenantId - The UUID of the tenant.
   * @param {Omit<NewMenuCategory, 'tenantId'>} data - The category details (name, sortOrder, etc).
   * @returns {Promise<MenuCategory>} A promise resolving to the created category.
   */
  async createCategory(tenantId: string, data: Omit<NewMenuCategory, 'tenantId'>) {
    const [category] = await db.insert(menuCategories).values({
      ...data,
      tenantId,
    }).returning();
    
    // Invalidate all branch menus for this tenant
    // (In production, use Redis SCAN or maintain a set of keys to invalidate)
    return category;
  }

  /**
   * Creates a new Menu Item within a specific Category.
   *
   * @param {string} tenantId - The UUID of the tenant.
   * @param {Omit<NewMenuItem, 'tenantId'>} data - The item details (name, price, isVeg, etc).
   * @returns {Promise<MenuItem>} A promise resolving to the created menu item.
   */
  async createMenuItem(tenantId: string, data: Omit<NewMenuItem, 'tenantId'>) {
    const [item] = await db.insert(menuItems).values({
      ...data,
      tenantId,
    }).returning();

    return item;
  }

  /**
   * Updates an existing Menu Item (e.g., marking it out of stock, or changing price).
   * Enforces tenant isolation.
   * Automatically invalidates the associated Redis cache for the given branch.
   *
   * @param {string} tenantId - The UUID of the tenant performing the update.
   * @param {string} branchId - The UUID of the branch (used to target the correct Redis cache key).
   * @param {string} itemId - The UUID of the menu item to update.
   * @param {Partial<NewMenuItem>} data - The fields to update.
   * @returns {Promise<MenuItem>} A promise resolving to the updated item.
   * @throws {Error} If the item does not exist or does not belong to the tenant.
   */
  async updateMenuItem(tenantId: string, branchId: string, itemId: string, data: Partial<NewMenuItem>) {
    const [existing] = await db.select().from(menuItems).where(
      and(
        eq(menuItems.id, itemId),
        eq(menuItems.tenantId, tenantId)
      )
    );

    if (!existing) {
      throw new Error('Menu item not found or unauthorized');
    }

    const [updated] = await db.update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(menuItems.id, itemId))
      .returning();

    // Invalidate Cache for this branch so customers see the updated price/stock immediately
    await redis.del(`menu:tenant:${tenantId}:branch:${branchId}`);

    return updated;
  }

  /**
   * Creates a new Menu Add-on (global or item-specific)
   */
  async createAddon(tenantId: string, data: Omit<NewMenuItemAddon, 'tenantId'>) {
    const [addon] = await db.insert(menuItemAddons).values({
      ...data,
      tenantId,
    }).returning();

    return addon;
  }

  /**
   * Fetches all active addons/modifiers for a specific tenant.
   */
  async getAddons(tenantId: string) {
    return await db.select()
      .from(menuItemAddons)
      .where(
        and(
          eq(menuItemAddons.tenantId, tenantId),
          eq(menuItemAddons.isActive, true)
        )
      )
      .execute();
  }

  /**
   * Updates an existing Menu Category.
   */
  async updateCategory(tenantId: string, id: string, data: Partial<NewMenuCategory>) {
    const [updated] = await db
      .update(menuCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(menuCategories.id, id), eq(menuCategories.tenantId, tenantId)))
      .returning();
    return updated;
  }

  /**
   * Deletes a Menu Category. Soft delete or hard delete depending on design.
   */
  async deleteCategory(tenantId: string, id: string) {
    // We will delete the category, and set its items categoryId to null or uncategorized
    await db.transaction(async (tx) => {
      await tx
        .update(menuItems)
        .set({ categoryId: null })
        .where(and(eq(menuItems.categoryId, id), eq(menuItems.tenantId, tenantId)));

      await tx
        .delete(menuCategories)
        .where(and(eq(menuCategories.id, id), eq(menuCategories.tenantId, tenantId)));
    });
    return { success: true };
  }

  /**
   * Soft deletes a Menu Item.
   */
  async deleteMenuItem(tenantId: string, branchId: string, id: string) {
    const [deleted] = await db
      .update(menuItems)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)))
      .returning();

    // Invalidate Redis cache
    await redis.del(`menu:tenant:${tenantId}:branch:${branchId}`);
    return deleted;
  }
}

