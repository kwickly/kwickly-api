import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { auditLogs, users } from '../../db/schema/index.ts';

export class TenantService {
  /**
   * Retrieves audit logs specifically scoped to the given tenantId.
   */
  async getAuditLogs(tenantId: string, limit: number = 50, offset: number = 0) {
    const logs = await db
      .select({
        id: auditLogs.id,
        method: auditLogs.method,
        path: auditLogs.path,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        statusCode: auditLogs.statusCode,
        createdAt: auditLogs.createdAt,
        userRole: auditLogs.userRole,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return logs;
  }
}
