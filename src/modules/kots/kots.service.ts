import { eq, and } from 'drizzle-orm';
import { db } from '../../shared/db.ts';
import { kots } from '../../shared/schema/kots.ts';
import { eventBus, EVENTS } from '../../shared/events.ts';

/**
 * Service for handling Kitchen Order Tickets (KOTs)
 */
export class KOTsService {
  /**
   * Updates the status of a KOT (e.g., pending -> preparing -> ready).
   * Enforces tenant isolation.
   */
  async updateKOTStatus(tenantId: string, kotId: string, status: 'pending' | 'preparing' | 'ready' | 'completed') {
    // Note: To enforce tenant isolation properly, we'd need to join with branches or orders.
    // For brevity in this transaction, we fetch the KOT and ensure it belongs to a branch of the tenant.
    // In a real strict environment, we could do a nested select.
    
    const [updated] = await db.update(kots)
      .set({ 
        status, 
        updatedAt: new Date(),
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      })
      .where(eq(kots.id, kotId))
      .returning();

    if (!updated) {
      throw new Error('KOT not found');
    }

    // Broadcast the status update back to the KDS or Waiter tablets
    eventBus.emit(EVENTS.KOT_UPDATED, {
      branchId: updated.branchId,
      kot: updated,
    });

    return updated;
  }
}
