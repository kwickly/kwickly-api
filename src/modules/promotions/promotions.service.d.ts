export declare class PromotionsService {
    /**
     * Fetch active coupons for a tenant
     */
    getCoupons(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        code: string;
        discountType: "PERCENTAGE" | "FLAT";
        discountValue: string;
        minOrderValue: string | null;
        maxDiscountAmount: string | null;
        validFrom: Date | null;
        validUntil: Date | null;
        usageLimit: number | null;
        usedCount: number;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Create a new coupon
     */
    createCoupon(tenantId: string, payload: {
        code: string;
        discountType: 'PERCENTAGE' | 'FLAT';
        discountValue: string;
        minOrderValue?: string;
        maxDiscountAmount?: string;
    }): Promise<{
        id: string;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        code: string;
        discountType: "PERCENTAGE" | "FLAT";
        discountValue: string;
        minOrderValue: string | null;
        maxDiscountAmount: string | null;
        validFrom: Date | null;
        validUntil: Date | null;
        usageLimit: number | null;
        usedCount: number;
    }>;
    /**
     * Fetch predefined POS discounts
     */
    getPredefinedDiscounts(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        discountType: "PERCENTAGE" | "FLAT";
        discountValue: string;
        requiresManagerPin: boolean;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Create a predefined POS discount
     */
    createPredefinedDiscount(tenantId: string, payload: {
        name: string;
        discountType: 'PERCENTAGE' | 'FLAT';
        discountValue: string;
        requiresManagerPin: boolean;
    }): Promise<{
        id: string;
        name: string;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        discountType: "PERCENTAGE" | "FLAT";
        discountValue: string;
        requiresManagerPin: boolean;
    }>;
}
