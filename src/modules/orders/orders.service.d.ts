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
export declare class OrdersService {
    /**
     * Places an order securely inside a database transaction.
     * Fetches real prices from the DB, calculates totals, and creates the order and KOT.
     */
    placeOrder(tenantId: string, payload: PlaceOrderPayload): Promise<{
        order: {
            id: string;
            status: "cancelled" | "pending" | "accepted" | "preparing" | "ready" | "delivered";
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            branchId: string;
            customerId: string | null;
            subscriptionId: string | null;
            note: string | null;
            type: "combo" | "subscription_redemption" | "paid";
            subtotal: string;
            discountAmount: string;
            total: string;
            tableNumber: string | null;
        };
        kot: {
            id: string;
            status: "pending" | "preparing" | "ready" | "completed";
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            branchId: string;
            orderId: string;
            printedAt: Date | null;
            completedAt: Date | null;
        };
    }>;
    /**
     * Retrieves order history using Cursor-based Pagination.
     * Utilizes the composite index (tenant_id, branch_id, created_at).
     */
    getOrderHistory(tenantId: string, branchId: string, limit?: number, cursor?: string): Promise<any>;
}
