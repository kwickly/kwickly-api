import { db } from '../../db';
import { auditLogs } from '../../db/schema/auditLogs';
import { users } from '../../db/schema/users';
import { eq, and, desc, sql } from 'drizzle-orm';

export class AuditService {
  async getAuditLogs(tenantId: string, limit: number = 50, offset: number = 0) {
    const logs = await db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        userId: auditLogs.userId,
        userName: users.name,
        userRole: auditLogs.userRole,
        method: auditLogs.method,
        path: auditLogs.path,
        payload: auditLogs.payload,
        statusCode: auditLogs.statusCode,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId));
      
    const count = countResult[0]?.count || 0;

    return {
      logs,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    };
  }
}

export const auditService = new AuditService();
