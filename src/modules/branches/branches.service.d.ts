import type { NewBranch } from '../../db/schema/branches';
/**
 * Service handling all core business logic for physical Restaurant Branches.
 * Enforces multi-tenant isolation by requiring tenantId on all operations.
 */
export declare class BranchesService {
    /**
     * Retrieves a list of all active (non-deleted) branches belonging to a specific tenant.
     *
     * @param {string} tenantId - The UUID of the tenant requesting their branches.
     * @returns {Promise<Branch[]>} A promise that resolves to an array of Branch records.
     */
    listBranches(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        phone: string | null;
        latitude: number | null;
        longitude: number | null;
        openingHours: unknown;
        currency: string | null;
        status: "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";
        managerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Creates a new branch for the specified tenant.
     *
     * @param {string} tenantId - The UUID of the tenant creating the branch.
     * @param {Omit<NewBranch, 'tenantId'>} data - The payload containing branch details (name, address, etc).
     * @returns {Promise<Branch>} A promise that resolves to the newly created Branch record.
     */
    createBranch(tenantId: string, data: Omit<NewBranch, 'tenantId'>): Promise<{
        id: string;
        name: string;
        phone: string | null;
        address: string | null;
        status: "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        latitude: number | null;
        longitude: number | null;
        openingHours: unknown;
        currency: string | null;
        managerId: string | null;
    }>;
    /**
     * Updates an existing branch's details. Enforces tenant isolation to prevent IDOR attacks.
     * Automatically invalidates the associated Redis cache for this branch's configuration.
     *
     * @param {string} tenantId - The UUID of the tenant performing the update.
     * @param {string} branchId - The UUID of the branch to update.
     * @param {Partial<NewBranch>} data - The partial payload containing the fields to update.
     * @returns {Promise<Branch>} A promise that resolves to the updated Branch record.
     * @throws {Error} If the branch does not exist or does not belong to the tenant.
     */
    updateBranch(tenantId: string, branchId: string, data: Partial<NewBranch>): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        phone: string | null;
        latitude: number | null;
        longitude: number | null;
        openingHours: unknown;
        currency: string | null;
        status: "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";
        managerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
