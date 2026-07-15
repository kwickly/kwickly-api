export declare class PlatformService {
    /**
     * List all tenants in the system along with user and branch counts.
     */
    listTenants(page?: number, limit?: number, search?: string): Promise<{
        data: {
            branchCount: number;
            userCount: number;
            id: string;
            name: string;
            slug: string;
            phone: string | null;
            email: string | null;
            address: string | null;
            baseCurrency: string;
            plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
            status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
            annualPaidLeaveLimit: string;
            createdAt: Date;
            updatedAt: Date;
            suspendedAt: Date | null;
            terminatedAt: Date | null;
            deletedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Create a new tenant (restaurant group) on the platform.
     */
    createTenant(data: {
        name: string;
        slug: string;
        email?: string;
        phone?: string;
        address?: string;
        plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
        brandColor?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        email: string | null;
        address: string | null;
        baseCurrency: string;
        plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
        annualPaidLeaveLimit: string;
        createdAt: Date;
        updatedAt: Date;
        suspendedAt: Date | null;
        terminatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    /**
     * Update tenant basic configuration, plan, or active status.
     */
    updateTenant(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
        status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        email: string | null;
        address: string | null;
        baseCurrency: string;
        plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
        annualPaidLeaveLimit: string;
        createdAt: Date;
        updatedAt: Date;
        suspendedAt: Date | null;
        terminatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    /**
     * Soft delete a tenant.
     */
    deleteTenant(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        email: string | null;
        address: string | null;
        baseCurrency: string;
        plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
        annualPaidLeaveLimit: string;
        createdAt: Date;
        updatedAt: Date;
        suspendedAt: Date | null;
        terminatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    /**
     * Retrieve platform-wide metrics for Platform Dashboard.
     */
    getPlatformMetrics(): Promise<{
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        totalOrdersProcessed: number;
        platformGMV: number;
        planBreakdown: {
            FREE: number;
            STARTER: number;
            GROWTH: number;
            ENTERPRISE: number;
        };
    }>;
    /**
     * Retrieve system-wide mutating logs.
     */
    getAuditLogs(page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            method: string;
            path: string;
            ipAddress: string | null;
            userAgent: string | null;
            statusCode: number | null;
            userRole: string | null;
            createdAt: Date;
            userName: string;
            userEmail: string | null;
            tenantName: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Retrieve platform staff (super_admins and platform_owners).
     */
    getPlatformStaff(): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        createdAt: Date;
    }[]>;
    /**
     * Generate impersonation data for a tenant
     */
    generateImpersonationToken(adminUserId: string, tenantId: string): Promise<{
        tenantId: string;
        tenantName: string;
        branding: {
            [x: string]: any;
        };
        token: string;
    }>;
}
