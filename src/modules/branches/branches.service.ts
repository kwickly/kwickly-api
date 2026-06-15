import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db';
import type { NewBranch } from '../../db/schema/branches';
import { branches } from '../../db/schema/branches';
import { redis } from '../../shared/redis';

/**
 * Service handling all core business logic for physical Restaurant Branches.
 * Enforces multi-tenant isolation by requiring tenantId on all operations.
 */
export class BranchesService {
  /**
   * Retrieves a list of all active (non-deleted) branches belonging to a specific tenant.
   *
   * @param {string} tenantId - The UUID of the tenant requesting their branches.
   * @returns {Promise<Branch[]>} A promise that resolves to an array of Branch records.
   */
  async listBranches(tenantId: string) {
    return db.select()
      .from(branches)
      .where(
        and(
          eq(branches.tenantId, tenantId),
          isNull(branches.deletedAt)
        )
      );
  }

  /**
   * Creates a new branch for the specified tenant.
   *
   * @param {string} tenantId - The UUID of the tenant creating the branch.
   * @param {Omit<NewBranch, 'tenantId'>} data - The payload containing branch details (name, address, etc).
   * @returns {Promise<Branch>} A promise that resolves to the newly created Branch record.
   */
  async createBranch(tenantId: string, data: Omit<NewBranch, 'tenantId'>) {
    const [branch] = await db.insert(branches).values({
      ...data,
      tenantId,
    }).returning();
    
    return branch;
  }

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
  async updateBranch(tenantId: string, branchId: string, data: Partial<NewBranch>) {
    // 1. Enforce tenant isolation
    const [existing] = await db.select().from(branches).where(
      and(
        eq(branches.id, branchId),
        eq(branches.tenantId, tenantId)
      )
    );

    if (!existing) {
      throw new Error('Branch not found or unauthorized');
    }

    // 2. Perform update
    const [updated] = await db.update(branches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branches.id, branchId))
      .returning();

    // 3. Invalidate potential cached branch configs
    await redis.del(`branch:config:${branchId}`);

    return updated;
  }
}
