/**
 * Service for handling Kitchen Order Tickets (KOTs)
 */
export declare class KOTsService {
    /**
     * Updates the status of a KOT (e.g., pending -> preparing -> ready).
     * Enforces tenant isolation.
     */
    updateKOTStatus(tenantId: string, kotId: string, status: 'pending' | 'preparing' | 'ready' | 'completed'): Promise<{
        id: string;
        orderId: string;
        branchId: string;
        status: "pending" | "preparing" | "ready" | "completed";
        printedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
