export declare class AuditService {
    getAuditLogs(tenantId: string, limit?: number, offset?: number): Promise<{
        logs: {
            id: string;
            tenantId: string;
            userId: string;
            userName: string | null;
            userRole: string | null;
            method: string;
            path: string;
            payload: unknown;
            statusCode: number | null;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
export declare const auditService: AuditService;
