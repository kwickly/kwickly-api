export declare class InventoryService {
    /**
     * Fetch raw materials
     */
    getMaterials(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        uom: "KG" | "GRAM" | "LITER" | "MILLILITER" | "PIECE" | "BOX";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Add raw material
     */
    addMaterial(tenantId: string, payload: {
        name: string;
        uom: 'KG' | 'GRAM' | 'LITER' | 'MILLILITER' | 'PIECE' | 'BOX';
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        uom: "KG" | "GRAM" | "LITER" | "MILLILITER" | "PIECE" | "BOX";
    }>;
    /**
     * Get current stock aggregated from ledgers
     */
    getStock(tenantId: string, branchId: string): Promise<{
        rawMaterialId: string;
        totalStock: string | null;
    }[]>;
    /**
     * Adjust stock manually
     */
    adjustStock(tenantId: string, branchId: string, payload: {
        rawMaterialId: string;
        quantityChange: string;
        reason: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        branchId: string;
        reason: string;
        rawMaterialId: string;
        quantityChange: string;
    }>;
    /**
     * Add a recipe relation (BOM)
     */
    linkRecipe(payload: {
        menuItemId: string;
        rawMaterialId: string;
        quantityRequired: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        menuItemId: string;
        rawMaterialId: string;
        quantityRequired: string;
    }>;
    /**
     * Fetch all suppliers
     */
    getSuppliers(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        contactPerson: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
        gstNumber: string | null;
        taxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Add a new supplier
     */
    addSupplier(tenantId: string, payload: {
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
        gstNumber?: string;
        taxId?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        contactPerson: string | null;
        gstNumber: string | null;
        taxId: string | null;
    }>;
}
