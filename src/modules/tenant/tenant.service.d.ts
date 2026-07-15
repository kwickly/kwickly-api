export declare class TenantService {
    /**
     * Retrieves audit logs specifically scoped to the given tenantId.
     */
    getAuditLogs(tenantId: string, limit?: number, offset?: number): Promise<{
        data: {
            id: string;
            method: string;
            path: string;
            ipAddress: string | null;
            userAgent: string | null;
            statusCode: number | null;
            createdAt: Date;
            userRole: string | null;
            user: {
                id: string;
                name: string;
                email: string | null;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
