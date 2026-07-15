export declare class CrmService {
    /**
     * Fetch all customers for a tenant with their core profile and loyalty points.
     */
    getCustomers(tenantId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            walletBalance: string | null;
            lifetimeValue: string | null;
            marketingOptIn: boolean | null;
            loyaltyPoints: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Mock implementation of segments based on order frequency.
     */
    getSegments(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            name: string;
            ruleType: string;
            ruleValue: string;
            customerCount: number;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Mock implementation of campaigns.
     */
    getCampaigns(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            title: string;
            channel: string;
            status: string;
            sentCount: number;
            sentAt: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Real dynamic loyalty configuration.
     */
    getLoyaltyConfig(tenantId: string): Promise<{
        bronzeMultiplier: string;
        silverMultiplier: string;
        goldMultiplier: string;
        pointsPerRupee: string;
        walletTopUpEnabled: boolean;
        partialDeductionAllowed: boolean;
    }>;
    /**
     * Churn prevention logic using real order data.
     */
    getChurnRiskCustomers(tenantId: string): Promise<{
        riskScore: string;
        message: string;
        id: string;
        name: string;
        phone: string | null;
        lastOrderAt: string;
    }[]>;
    /**
     * Get a specific customer profile and calculate their current loyalty balance.
     */
    getCustomerProfile(tenantId: string, userId: string): Promise<{
        loyaltyPointsBalance: string;
        walletTransactions: {
            id: string;
            tenantId: string;
            userId: string;
            orderId: string | null;
            amount: string;
            type: "CREDIT" | "DEBIT";
            reason: string;
            createdAt: Date;
            deletedAt: Date | null;
        }[];
        loyaltyLedgers: {
            id: string;
            tenantId: string;
            userId: string;
            orderId: string | null;
            points: string;
            reason: string;
            createdAt: Date;
            deletedAt: Date | null;
        }[];
        id: string;
        tenantId: string;
        userId: string;
        dateOfBirth: Date | null;
        anniversaryDate: Date | null;
        marketingOptIn: boolean;
        lifetimeValue: string;
        walletBalance: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Create or update a customer profile (Marketing Opt-in, DOB, etc)
     */
    upsertCustomerProfile(tenantId: string, userId: string, payload: {
        dateOfBirth?: Date;
        anniversaryDate?: Date;
        marketingOptIn?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        userId: string;
        dateOfBirth: Date | null;
        anniversaryDate: Date | null;
        marketingOptIn: boolean;
        lifetimeValue: string;
        walletBalance: string;
    }>;
    /**
     * Adjust loyalty points manually or programmatically
     */
    adjustLoyaltyPoints(tenantId: string, userId: string, points: string, reason: string, orderId?: string): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        userId: string;
        orderId: string | null;
        reason: string;
        points: string;
    }>;
    /**
     * Adjust wallet balance
     */
    adjustWalletBalance(tenantId: string, userId: string, amount: string, type: 'CREDIT' | 'DEBIT', reason: string, orderId?: string): Promise<undefined>;
}
