import type { NewSubscriptionPlan } from '../../db/schema/subscriptions';
export declare class SubscriptionsService {
    /**
     * Fetch subscription plans for a tenant/branch.
     */
    getPlans(tenantId: string, branchId?: string, includeInactive?: boolean): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        name: string;
        description: string | null;
        mealType: "lunch" | "dinner" | "both";
        planType: "custom" | "meal_count" | "monthly";
        totalMeals: number;
        validityDays: number;
        price: string;
        carryForward: boolean;
        allowHoliday: boolean;
        status: "ACTIVE" | "GRANDFATHERED" | "ARCHIVED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Update an existing subscription plan
     */
    updatePlan(tenantId: string, planId: string, data: Partial<Omit<NewSubscriptionPlan, 'tenantId'>>): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        name: string;
        description: string | null;
        mealType: "lunch" | "dinner" | "both";
        planType: "custom" | "meal_count" | "monthly";
        totalMeals: number;
        validityDays: number;
        price: string;
        carryForward: boolean;
        allowHoliday: boolean;
        status: "ACTIVE" | "GRANDFATHERED" | "ARCHIVED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Soft delete a subscription plan
     */
    deletePlan(tenantId: string, planId: string): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        name: string;
        description: string | null;
        mealType: "lunch" | "dinner" | "both";
        planType: "custom" | "meal_count" | "monthly";
        totalMeals: number;
        validityDays: number;
        price: string;
        carryForward: boolean;
        allowHoliday: boolean;
        status: "ACTIVE" | "GRANDFATHERED" | "ARCHIVED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Mock purchase a plan (would be via webhook in real life).
     */
    purchasePlan(tenantId: string, customerId: string, planId: string): Promise<{
        id: string;
        status: "active" | "paused" | "expired" | "exhausted" | "cancelled";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        expiresAt: Date;
        totalMeals: number;
        customerId: string;
        planId: string;
        balanceRemaining: number;
        startsAt: Date;
        autoRenew: boolean;
        qrSecret: string;
    }>;
    /**
     * Generates a signed QR payload for the customer.
     * Payload: Base64( JSON.stringify({ subId, timestamp, sig }) )
     */
    generateQR(tenantId: string, customerId: string): Promise<string>;
    /**
     * Validates a QR code and deducts a meal.
     * Executed by the Staff QR Scanner app.
     */
    scanQR(tenantId: string, branchId: string, staffId: string, qrBase64: string): Promise<{
        success: boolean;
        message: string;
        remaining: number;
        log: {
            id: string;
            deletedAt: Date | null;
            tenantId: string;
            branchId: string;
            deviceId: string | null;
            mealType: "lunch" | "dinner";
            customerId: string;
            subscriptionId: string;
            staffId: string | null;
            scannedAt: Date;
            syncedAt: Date;
            isOfflineSync: boolean;
            note: string | null;
        };
    }>;
    /**
     * Create a new subscription plan (Admin)
     */
    createPlan(tenantId: string, data: Omit<NewSubscriptionPlan, 'tenantId'>): Promise<{
        id: string;
        name: string;
        status: "ACTIVE" | "GRANDFATHERED" | "ARCHIVED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        description: string | null;
        branchId: string | null;
        price: string;
        mealType: "lunch" | "dinner" | "both";
        planType: "custom" | "meal_count" | "monthly";
        totalMeals: number;
        validityDays: number;
        carryForward: boolean;
        allowHoliday: boolean;
    }>;
    /**
     * Fetch all customer subscriptions for a tenant (Dashboard View)
     */
    getCustomerSubscriptions(tenantId: string): Promise<({
        id: string;
        status: "active" | "paused" | "expired" | "exhausted" | "cancelled";
        totalMeals: number;
        balanceRemaining: number;
        startsAt: Date;
        expiresAt: Date;
        autoRenew: boolean;
        createdAt: Date;
        customer: {
            id: any;
            name: any;
            email: any;
        };
        plan: {
            id: string;
            name: string;
            mealType: "lunch" | "dinner" | "both";
        };
    } | {
        id: string;
        status: "active" | "paused" | "expired" | "exhausted" | "cancelled";
        totalMeals: number;
        balanceRemaining: number;
        startsAt: Date;
        expiresAt: Date;
        autoRenew: boolean;
        createdAt: Date;
        customer: {
            id: any;
            name: any;
            email: any;
        };
        plan: {
            id: string;
            name: string;
            mealType: "lunch" | "dinner" | "both";
        };
    })[]>;
    /**
     * Update customer subscription status (Pause / Activate / Cancel)
     */
    updateCustomerSubscriptionStatus(tenantId: string, subscriptionId: string, status: 'active' | 'paused' | 'cancelled'): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        planId: string;
        status: "active" | "paused" | "expired" | "exhausted" | "cancelled";
        totalMeals: number;
        balanceRemaining: number;
        startsAt: Date;
        expiresAt: Date;
        autoRenew: boolean;
        qrSecret: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
