import { eq, inArray, and } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { orders, orderItems } from '../../db/schema/orders.ts';
import { kots } from '../../db/schema/kots.ts';
import { menuItems } from '../../db/schema/menus.ts';
import { eventBus, EVENTS } from '../../shared/events.ts';
import { sql } from 'drizzle-orm';

export type OrderItemPayload = {
  menuItemId: string;
  quantity: number;
};

export type PlaceOrderPayload = {
  branchId: string;
  customerId?: string;
  type: 'paid' | 'subscription_redemption' | 'combo';
  tableNumber?: string;
  note?: string;
  items: OrderItemPayload[];
};

/**
 * Service handling Order Placement and Transactions.
 * Enforces strict Server-Side Pricing (Trust No Client).
 */
export class OrdersService {
  /**
   * Places an order securely inside a database transaction.
   * Fetches real prices from the DB, calculates totals, and creates the order and KOT.
   */
  async placeOrder(tenantId: string, payload: PlaceOrderPayload) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // 1. Fetch the True Prices from the Database (Trust No Client)
    const itemIds = payload.items.map((i) => i.menuItemId);
    const trueMenuItems = await db
      .select({ id: menuItems.id, name: menuItems.name, price: menuItems.price })
      .from(menuItems)
      .where(
        and(
          inArray(menuItems.id, itemIds),
          eq(menuItems.tenantId, tenantId)
        )
      );

    if (trueMenuItems.length !== itemIds.length) {
      throw new Error('One or more menu items are invalid or do not belong to this tenant');
    }

    const priceMap = new Map(trueMenuItems.map((item) => [item.id, item]));

    // 2. Calculate Totals
    let subtotal = 0;
    const finalOrderItems = payload.items.map((payloadItem) => {
      const dbItem = priceMap.get(payloadItem.menuItemId)!;
      const unitPrice = parseFloat(dbItem.price);
      const totalLinePrice = unitPrice * payloadItem.quantity;
      subtotal += totalLinePrice;

      return {
        menuItemId: dbItem.id,
        name: dbItem.name, // Snapshot the name
        quantity: payloadItem.quantity,
        unitPrice: unitPrice.toString(),
        total: totalLinePrice.toString(),
      };
    });

    const discountAmount = 0; // Future: Apply coupons or predefined discounts here
    const total = subtotal - discountAmount;

    // 3. Execute ACID Transaction
    const result = await db.transaction(async (tx) => {
      // 3a. Insert Master Order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          branchId: payload.branchId,
          customerId: payload.customerId,
          type: payload.type,
          status: 'pending',
          subtotal: subtotal.toString(),
          discountAmount: discountAmount.toString(),
          total: total.toString(),
          tableNumber: payload.tableNumber,
          note: payload.note,
        })
        .returning();

      if (!newOrder) throw new Error('Order creation failed');

      // 3b. Insert Line Items
      const orderItemsToInsert = finalOrderItems.map((i) => ({
        ...i,
        orderId: newOrder.id,
      }));
      await tx.insert(orderItems).values(orderItemsToInsert);

      // 3c. Generate KOT (Kitchen Order Ticket)
      const [newKot] = await tx
        .insert(kots)
        .values({
          orderId: newOrder.id,
          branchId: payload.branchId,
          status: 'pending',
        })
        .returning();

      return { order: newOrder, kot: newKot };
    });

    // 4. Instantly broadcast to Kitchen Display System (KDS) via WebSockets
    eventBus.emit(EVENTS.NEW_KOT, {
      branchId: payload.branchId,
      kot: result.kot,
      order: result.order,
      items: finalOrderItems,
    });

    return result;
  }

  /**
   * Retrieves order history using Cursor-based Pagination.
   * Utilizes the composite index (tenant_id, branch_id, created_at).
   */
  async getOrderHistory(tenantId: string, branchId: string, limit: number = 20, cursor?: string) {
    let cursorDate: Date | null = null;
    
    // Decode base64 cursor back to a Date
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        cursorDate = new Date(decoded);
      } catch (e) {
        // Invalid cursor, ignore it
      }
    }

    // We fetch limit + 1 to determine if there is a 'next page'
    const fetchLimit = limit + 1;

    // Use raw SQL with optional cursor
    const history = await db.execute(sql`
      SELECT 
        o.id,
        o.type,
        o.status,
        o.subtotal,
        o.discount_amount,
        o.total,
        o.created_at as "createdAt",
        json_agg(
          json_build_object(
            'name', oi.name,
            'quantity', oi.quantity,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 
        o.tenant_id = ${tenantId}
        AND o.branch_id = ${branchId}
        ${cursorDate ? sql`AND o.created_at < ${cursorDate}` : sql``}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${fetchLimit}
    `);

    const rows = (history as any).rows || history;
    return rows;
  }
}
