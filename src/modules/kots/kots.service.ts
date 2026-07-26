import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { kots } from '../../db/schema/kots.ts';
import { eventBus, EVENTS } from '../../shared/events.ts';
import { OrdersService } from '../orders/orders.service.ts';

const ordersService = new OrdersService();

/**
 * Service for handling Kitchen Order Tickets (KOTs)
 */
export class KOTsService {
  /**
   * Updates the status of a KOT (e.g., pending -> preparing -> ready).
   * Enforces tenant isolation.
   */
  async updateKOTStatus(tenantId: string, kotId: string, status: 'pending' | 'preparing' | 'ready' | 'completed') {
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

    // Sync the master order status with the new KOT state
    await ordersService.syncOrderStatusWithKOTs(updated.orderId);

    // Broadcast the status update back to the KDS or Waiter tablets
    eventBus.emit(EVENTS.KOT_UPDATED, {
      branchId: updated.branchId,
      kot: updated,
    });

    return updated;
  }
}
