import { eq, inArray, and } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { orders, orderItems } from '../../db/schema/orders.ts';
import { kots } from '../../db/schema/kots.ts';
import { menuItems } from '../../db/schema/menus.ts';
import { eventBus, EVENTS } from '../../shared/events.ts';
import { sql } from 'drizzle-orm';
import { restaurantTables, tableSessions } from '../../db/schema/index.ts';

export type OrderItemPayload = {
  menuItemId: string;
  quantity: number;
  fulfillmentMode?: 'dine_in' | 'takeaway' | 'delivery';
};

export type PlaceOrderPayload = {
  branchId: string;
  customerId?: string;
  type: 'paid' | 'subscription_redemption' | 'combo';
  mode?: 'dine_in' | 'takeaway' | 'delivery';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod?: 'razorpay' | 'cash' | 'upi' | 'wallet';
  tableNumber?: string;
  qrToken?: string; // Short token from QR code sticker
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
    const itemIds = Array.from(new Set(payload.items.map((i) => i.menuItemId)));
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
        fulfillmentMode: payloadItem.fulfillmentMode,
        unitPrice: unitPrice.toString(),
        total: totalLinePrice.toString(),
      };
    });

    const discountAmount = 0; // Future: Apply coupons or predefined discounts here
    const total = subtotal - discountAmount;

    // 3. Resolve Table & Session
    let tableId: string | undefined;
    let sessionId: string | undefined;
    let table: any | undefined;
    
    if (payload.qrToken) {
      const [foundTable] = await db.select().from(restaurantTables)
        .where(eq(restaurantTables.qrToken, payload.qrToken));
      if (!foundTable) throw new Error('Invalid QR Token');
      table = foundTable;
      tableId = table.id;
      
      // If table already has an active session, we should actually append to it.
      // But if calling placeOrder directly, maybe they are taking over a stale session?
      // For safety, we'll create a new session if none exists. If one exists, we ideally use addItemsToOrder.
      if (table.currentSessionId) {
        // Table is occupied. Just add items to the existing session's order!
        return await this.addItemsToSession(tenantId, table.currentSessionId, { items: payload.items });
      }
    }

    // 4. Execute Inserts (Sequential due to neon-http not supporting transactions)
    // 4a. Insert Master Order
    const [newOrder] = await db
      .insert(orders)
      .values({
        tenantId,
        branchId: payload.branchId,
        customerId: payload.customerId,
        type: payload.type,
        mode: payload.mode || 'dine_in',
        status: 'pending',
        paymentStatus: payload.paymentStatus || 'pending',
        paymentMethod: payload.paymentMethod || null,
        subtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        total: total.toString(),
        tableNumber: table ? table.name : payload.tableNumber,
        tableId, // FK
        note: payload.note,
      })
      .returning();

    if (!newOrder) throw new Error('Order creation failed');

    // 4b. Create Session if needed
    if (tableId && !sessionId) {
      const [newSession] = await db.insert(tableSessions).values({
        tableId,
        branchId: payload.branchId,
        orderId: newOrder.id,
        status: 'open',
      }).returning();
      sessionId = newSession.id;

      // Update table with current session
      await db.update(restaurantTables)
        .set({ currentSessionId: sessionId, status: 'occupied' })
        .where(eq(restaurantTables.id, tableId));
      
      // Update order with session
      await db.update(orders)
        .set({ sessionId })
        .where(eq(orders.id, newOrder.id));
    }

    // 4c. Insert Line Items
    const orderItemsToInsert = finalOrderItems.map((i) => ({
      ...i,
      orderId: newOrder.id,
    }));
    await db.insert(orderItems).values(orderItemsToInsert);

    // 4d. Generate KOT (Kitchen Order Ticket) Round 1
    const [newKot] = await db
      .insert(kots)
      .values({
        orderId: newOrder.id,
        branchId: payload.branchId,
        tableSessionId: sessionId,
        kotRound: 1,
        status: 'pending',
      })
      .returning();

    const result = { order: newOrder, kot: newKot };

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
   * Updates an existing order's items (for Dine-in modifications).
   * Recalculates totals, updates the order, replaces items, and resets KOT.
   */
  async updateOrderItems(tenantId: string, orderId: string, payload: { items: OrderItemPayload[] }) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // 1. Fetch True Prices
    const itemIds = Array.from(new Set(payload.items.map((i) => i.menuItemId)));
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
        orderId,
        menuItemId: dbItem.id,
        name: dbItem.name,
        quantity: payloadItem.quantity,
        fulfillmentMode: payloadItem.fulfillmentMode,
        unitPrice: unitPrice.toString(),
        total: totalLinePrice.toString(),
      };
    });

    const discountAmount = 0;
    const total = subtotal - discountAmount;

    // 3. Execute Inserts (Sequential due to neon-http not supporting transactions)
    // 3a. Verify Order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (!existingOrder) throw new Error('Order not found');

    const newSubtotal = parseFloat(existingOrder.subtotal) + subtotal;
    const newTotal = parseFloat(existingOrder.total) + subtotal; // Assuming discount amount doesn't change dynamically for append

    // 3b. Update Master Order
    const [updatedOrder] = await db
      .update(orders)
      .set({
        subtotal: newSubtotal.toString(),
        total: newTotal.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // 3c. Append New Line Items (Append-only)
    // Instead of deleting existing items, we just insert the newly added items.
    // The front-end now sends only the *newly added* items when modifying an order.
    const insertedItems = await db.insert(orderItems).values(finalOrderItems).returning();

    // 3d. Update KOT to pending (or create a new KOT round for these items)
    // Assuming KOTs are per-order. For true append-only rounds, we would create a new KOT.
    // Since the schema has a 1-to-1 or 1-to-many relationship, we'll update the existing KOT 
    // or we'd ideally create a new KOT. Let's stick to updating the order's KOT status to pending for now
    // so the kitchen sees the new items.
    const [updatedKot] = await db
      .update(kots)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(kots.orderId, orderId))
      .returning();

    const result = { order: updatedOrder, kot: updatedKot };

    // 4. Instantly broadcast update
    if (result.kot && result.order) {
      eventBus.emit(EVENTS.KOT_UPDATED, {
        branchId: result.order.branchId,
        kot: result.kot,
        order: result.order,
        items: insertedItems, // Broadcast only the newly added items
      });
    }

    return result;
  }

  /**
   * Adds more items to an existing open Table Session (Order).
   * Used when diners want to order more food. Generates a new KOT round.
   */
  async addItemsToSession(tenantId: string, sessionId: string, payload: { items: OrderItemPayload[] }) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Must provide items to add');
    }

    // 1. Resolve Session and Order
    const [session] = await db.select().from(tableSessions).where(eq(tableSessions.id, sessionId));
    if (!session || session.status !== 'open') throw new Error('Valid open session not found');

    const [existingOrder] = await db.select().from(orders).where(and(eq(orders.id, session.orderId), eq(orders.tenantId, tenantId)));
    if (!existingOrder) throw new Error('Associated order not found');

    // 2. Fetch True Prices
    const itemIds = Array.from(new Set(payload.items.map((i) => i.menuItemId)));
    const trueMenuItems = await db
      .select({ id: menuItems.id, name: menuItems.name, price: menuItems.price })
      .from(menuItems)
      .where(and(inArray(menuItems.id, itemIds), eq(menuItems.tenantId, tenantId)));

    if (trueMenuItems.length !== itemIds.length) {
      throw new Error('One or more menu items are invalid');
    }
    const priceMap = new Map(trueMenuItems.map((item) => [item.id, item]));

    // 3. Calculate New Additions Totals
    let newSubtotal = 0;
    const finalOrderItems = payload.items.map((payloadItem) => {
      const dbItem = priceMap.get(payloadItem.menuItemId)!;
      const unitPrice = parseFloat(dbItem.price);
      const totalLinePrice = unitPrice * payloadItem.quantity;
      newSubtotal += totalLinePrice;

      return {
        orderId: existingOrder.id,
        menuItemId: dbItem.id,
        name: dbItem.name,
        quantity: payloadItem.quantity,
        fulfillmentMode: payloadItem.fulfillmentMode,
        unitPrice: unitPrice.toString(),
        total: totalLinePrice.toString(),
      };
    });

    // 4. Update Order Totals
    const currentSubtotal = parseFloat(existingOrder.subtotal);
    const updatedSubtotal = currentSubtotal + newSubtotal;
    const updatedTotal = updatedSubtotal - parseFloat(existingOrder.discountAmount);

    const [updatedOrder] = await db.update(orders)
      .set({
        subtotal: updatedSubtotal.toString(),
        total: updatedTotal.toString(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, existingOrder.id))
      .returning();

    // 5. Insert New Line Items
    await db.insert(orderItems).values(finalOrderItems);

    // 6. Increment Session KOT Round
    const nextRound = session.kotRound + 1;
    await db.update(tableSessions)
      .set({ kotRound: nextRound })
      .where(eq(tableSessions.id, session.id));

    // 7. Generate New KOT for this round
    const [newKot] = await db.insert(kots)
      .values({
        orderId: existingOrder.id,
        branchId: existingOrder.branchId,
        tableSessionId: session.id,
        kotRound: nextRound,
        status: 'pending',
      })
      .returning();

    const result = { order: updatedOrder, kot: newKot };

    // 8. Broadcast to KDS
    eventBus.emit(EVENTS.NEW_KOT, {
      branchId: existingOrder.branchId,
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
  async getOrderHistory(tenantId: string, branchId: string, limit: number = 20, cursor?: string, paymentStatus?: string) {
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
        o.mode,
        o.payment_status as "paymentStatus",
        o.payment_method as "paymentMethod",
        o.status,
        o.subtotal,
        o.discount_amount,
        o.total,
        o.created_at as "createdAt",
        o.table_number as "tableNumber",
        json_agg(
          json_build_object(
            'menuItemId', oi.menu_item_id,
            'name', oi.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 
        o.tenant_id = ${tenantId}
        AND o.branch_id = ${branchId}
        ${paymentStatus ? sql`AND o.payment_status = ${paymentStatus}` : sql``}
        ${cursorDate ? sql`AND o.created_at < ${cursorDate}` : sql``}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${fetchLimit}
    `);

    const rows = (history as any).rows || history;
    return rows;
  }

  /**
   * Retrieves active KOTs for a branch (Pending, Preparing).
   */
  async getActiveKOTs(branchId: string) {
    const activeKots = await db.execute(sql`
      SELECT 
        k.id,
        o.id as "orderId",
        k.status,
        k.created_at as "createdAt",
        k.kot_round as "kotRound",
        o.mode as "orderMode",
        o.table_number as "tableNumber",
        o.note as "orderNote",
        json_agg(
          json_build_object(
            'name', oi.name,
            'quantity', oi.quantity,
            'fulfillmentMode', oi.fulfillment_mode
          )
        ) as items
      FROM kots k
      JOIN orders o ON k.order_id = o.id
      JOIN order_items oi ON o.id = oi.order_id
      WHERE 
        k.branch_id = ${branchId}
        AND k.status IN ('pending', 'preparing')
      GROUP BY k.id, o.id
      ORDER BY k.created_at ASC
    `);

    const rows = (activeKots as any).rows || activeKots;
    return rows;
  }

  /**
   * Updates the status of a KOT.
   */
  async updateKOTStatus(kotId: string, status: 'pending' | 'preparing' | 'ready' | 'completed') {
    const [updated] = await db.update(kots)
      .set({ status, updatedAt: new Date() })
      .where(eq(kots.id, kotId))
      .returning();
      
    if (!updated) {
      throw new Error('KOT not found');
    }

    // Broadcast the KOT status update
    eventBus.emit(EVENTS.KOT_UPDATED, { branchId: updated.branchId, kot: updated });
    
    return updated;
  }

  /**
   * Updates the payment status and method of an Order (e.g. In-Hand Settlement).
   */
  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded', paymentMethod?: 'razorpay' | 'cash' | 'upi' | 'wallet') {
    const [updated] = await db.update(orders)
      .set({ 
        paymentStatus, 
        ...(paymentMethod && { paymentMethod }) 
      })
      .where(eq(orders.id, orderId))
      .returning();
      
    if (!updated) {
      throw new Error('Order not found');
    }
    
    // Broadcast if necessary
    eventBus.emit('ORDER_PAYMENT_UPDATED', updated);
    
    return updated;
  }
  /**
   * Retrieves the public status of an order for the customer tracking screen.
   */
  async getPublicOrderStatus(orderId: string) {
    const orderData = await db.execute(sql`
      SELECT 
        o.id,
        o.status as "orderStatus",
        o.mode,
        o.table_number as "tableNumber",
        o.subtotal,
        o.total,
        o.created_at as "createdAt",
        (SELECT status FROM kots k WHERE k.order_id = o.id ORDER BY created_at DESC LIMIT 1) as "kotStatus",
        t.default_preparation_time as "defaultPreparationTime",
        (COALESCE((SELECT MAX(created_at) FROM kots k WHERE k.order_id = o.id), o.created_at) + (t.default_preparation_time * interval '1 minute')) as "estimatedCompletionTime",
        (SELECT json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'total', oi.total,
            'fulfillmentMode', oi.fulfillment_mode
          )
        ) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN tenants t ON t.id = o.tenant_id
      WHERE o.id = ${orderId}
      LIMIT 1
    `);

    const rows = (orderData as any).rows || orderData;
    if (!rows || rows.length === 0) {
      throw new Error('Order not found');
    }

    return rows[0];
  }
}
