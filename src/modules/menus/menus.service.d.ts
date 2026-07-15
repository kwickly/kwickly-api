import type { NewMenuCategory, NewMenuItem, NewMenuItemAddon, NewMenuItemVariant } from '../../db/schema/menus';
/**
 * Service handling all core business logic for the Restaurant Menus.
 * Responsible for Categories, Items, and aggressive Redis caching of the menu tree.
 */
export declare class MenusService {
    /**
     * Fetches the fully nested menu tree (Categories -> Items) for a specific branch.
     * This method utilizes the Cache-Aside pattern via Redis (`withCache`) for ultra-fast customer-facing reads.
     *
     * @param {string} tenantId - The UUID of the tenant.
     * @param {string} branchId - The UUID of the specific branch.
     * @returns {Promise<Array<MenuCategory & { items: MenuItem[] }>>} A promise resolving to the nested menu tree.
     */
    getMenu(tenantId: string, branchId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            items: {
                variants: {
                    id: string;
                    menuItemId: string;
                    name: string;
                    priceDelta: string;
                    isDefault: boolean;
                    deletedAt: Date | null;
                }[];
                addons: {
                    id: string;
                    tenantId: string;
                    menuItemId: string | null;
                    name: string;
                    price: string;
                    status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                    deletedAt: Date | null;
                }[];
                id: string;
                tenantId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: string;
                imageUrl: string | null;
                isVeg: boolean;
                isJain: boolean;
                isGlutenFree: boolean;
                spiceLevel: number | null;
                availability: "always" | "time_window" | "days";
                availableFrom: string | null;
                availableUntil: string | null;
                sortOrder: number;
                status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            }[];
            id: string;
            tenantId: string;
            name: string;
            imageUrl: string | null;
            sortOrder: number;
            status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Creates a new Menu Category for the tenant.
     *
     * @param {string} tenantId - The UUID of the tenant.
     * @param {Omit<NewMenuCategory, 'tenantId'>} data - The category details (name, sortOrder, etc).
     * @returns {Promise<MenuCategory>} A promise resolving to the created category.
     */
    createCategory(tenantId: string, data: Omit<NewMenuCategory, 'tenantId'>): Promise<{
        id: string;
        name: string;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        imageUrl: string | null;
        sortOrder: number;
    }>;
    /**
     * Creates a new Menu Item within a specific Category.
     *
     * @param {string} tenantId - The UUID of the tenant.
     * @param {Omit<NewMenuItem, 'tenantId'>} data - The item details (name, price, isVeg, etc).
     * @returns {Promise<MenuItem>} A promise resolving to the created menu item.
     */
    createMenuItem(tenantId: string, data: Omit<NewMenuItem, 'tenantId'>): Promise<{
        id: string;
        name: string;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        description: string | null;
        imageUrl: string | null;
        sortOrder: number;
        categoryId: string;
        price: string;
        isVeg: boolean;
        isJain: boolean;
        isGlutenFree: boolean;
        spiceLevel: number | null;
        availability: "always" | "time_window" | "days";
        availableFrom: string | null;
        availableUntil: string | null;
    }>;
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
    updateMenuItem(tenantId: string, branchId: string, itemId: string, data: Partial<NewMenuItem>): Promise<{
        id: string;
        tenantId: string;
        categoryId: string;
        name: string;
        description: string | null;
        price: string;
        imageUrl: string | null;
        isVeg: boolean;
        isJain: boolean;
        isGlutenFree: boolean;
        spiceLevel: number | null;
        availability: "always" | "time_window" | "days";
        availableFrom: string | null;
        availableUntil: string | null;
        sortOrder: number;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Creates a new Menu Add-on (global or item-specific)
     */
    createAddon(tenantId: string, data: Omit<NewMenuItemAddon, 'tenantId'>): Promise<{
        id: string;
        name: string;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        deletedAt: Date | null;
        tenantId: string;
        price: string;
        menuItemId: string | null;
    }>;
    /**
     * Fetches all active addons/modifiers for a specific tenant.
     */
    getAddons(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            tenantId: string;
            menuItemId: string | null;
            name: string;
            price: string;
            status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
            deletedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Updates an existing Menu Category.
     */
    updateCategory(tenantId: string, id: string, data: Partial<NewMenuCategory>): Promise<{
        id: string;
        tenantId: string;
        name: string;
        imageUrl: string | null;
        sortOrder: number;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Deletes a Menu Category. Soft delete or hard delete depending on design.
     */
    deleteCategory(tenantId: string, id: string): Promise<{
        success: boolean;
    }>;
    /**
     * Soft deletes a Menu Item.
     */
    deleteMenuItem(tenantId: string, branchId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        categoryId: string;
        name: string;
        description: string | null;
        price: string;
        imageUrl: string | null;
        isVeg: boolean;
        isJain: boolean;
        isGlutenFree: boolean;
        spiceLevel: number | null;
        availability: "always" | "time_window" | "days";
        availableFrom: string | null;
        availableUntil: string | null;
        sortOrder: number;
        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Creates a new Menu Item Variant.
     */
    createVariant(tenantId: string, branchId: string, data: NewMenuItemVariant): Promise<{
        id: string;
        name: string;
        deletedAt: Date | null;
        menuItemId: string;
        priceDelta: string;
        isDefault: boolean;
    }>;
    /**
     * Updates an existing Menu Item Variant.
     */
    updateVariant(tenantId: string, branchId: string, id: string, data: Partial<NewMenuItemVariant>): Promise<{
        id: string;
        menuItemId: string;
        name: string;
        priceDelta: string;
        isDefault: boolean;
        deletedAt: Date | null;
    }>;
    /**
     * Soft deletes a Menu Item Variant.
     */
    deleteVariant(tenantId: string, branchId: string, id: string): Promise<{
        id: string;
        menuItemId: string;
        name: string;
        priceDelta: string;
        isDefault: boolean;
        deletedAt: Date | null;
    }>;
}
