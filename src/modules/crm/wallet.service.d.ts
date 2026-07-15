export declare class WalletService {
    /**
     * Add funds (Credit) to a customer's wallet
     */
    creditWallet(tenantId: string, userId: string, amount: number, reason: string, orderId?: string): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        userId: string;
        orderId: string | null;
        amount: string;
        type: "CREDIT" | "DEBIT";
        reason: string;
    }>;
    /**
     * Deduct funds (Debit) from a customer's wallet
     */
    debitWallet(tenantId: string, userId: string, amount: number, reason: string, orderId?: string): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        userId: string;
        orderId: string | null;
        amount: string;
        type: "CREDIT" | "DEBIT";
        reason: string;
    }>;
    /**
     * Fetch wallet transaction history for a customer
     */
    getWalletHistory(tenantId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        userId: string;
        orderId: string | null;
        amount: string;
        type: "CREDIT" | "DEBIT";
        reason: string;
        createdAt: Date;
        deletedAt: Date | null;
    }[]>;
}
