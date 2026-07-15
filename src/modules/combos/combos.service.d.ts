export declare class CombosService {
    /**
     * Fetch all active combos for a branch (and tenant).
     */
    getCombos(tenantId: string, branchId?: string): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        name: string;
        description: string | null;
        imageUrl: string | null;
        price: string;
        availableFrom: string | null;
        availableUntil: string | null;
        status: "ACTIVE" | "PAUSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Create a new combo bundle with its linked menu items.
     */
    createCombo(tenantId: string, payload: {
        branchId?: string;
        name: string;
        description?: string;
        price: string;
        items: {
            menuItemId: string;
            quantity: number;
        }[];
    }): Promise<{
        id: string;
        name: string;
        status: "ACTIVE" | "PAUSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        description: string | null;
        branchId: string | null;
        imageUrl: string | null;
        price: string;
        availableFrom: string | null;
        availableUntil: string | null;
    }>;
}
