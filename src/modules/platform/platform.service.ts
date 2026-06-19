import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { tenants, branches, users, orders, auditLogs } from '../../db/schema/index.ts';

export class PlatformService {
  /**
   * List all tenants in the system along with user and branch counts.
   */
  async listTenants() {
    const allTenants = await db.select().from(tenants).where(isNull(tenants.deletedAt));

    const result = [];
    for (const t of allTenants) {
      // Fetch branch count
      const [branchCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(and(eq(branches.tenantId, t.id), isNull(branches.deletedAt)));

      // Fetch user count
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.tenantId, t.id), isNull(users.deletedAt)));

      result.push({
        ...t,
        branchCount: Number(branchCount?.count || 0),
        userCount: Number(userCount?.count || 0),
      });
    }

    return result;
  }

  /**
   * Create a new tenant (restaurant group) on the platform.
   */
  async createTenant(data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    address?: string;
    plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    brandColor?: string;
  }) {
    const [newTenant] = await db.insert(tenants).values({
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      address: data.address,
      plan: data.plan || 'FREE',
      brandColor: data.brandColor || '#6366F1',
    }).returning();

    return newTenant;
  }

  /**
   * Update tenant basic configuration, plan, or active status.
   */
  async updateTenant(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
      isActive?: boolean;
    }
  ) {
    const [updated] = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete a tenant.
   */
  async deleteTenant(id: string) {
    const [deleted] = await db
      .update(tenants)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(tenants.id, id))
      .returning();

    return deleted;
  }

  /**
   * Retrieve platform-wide metrics for Platform Dashboard.
   */
  async getPlatformMetrics() {
    // 1. Total Tenants
    const allTenants = await db.select().from(tenants).where(isNull(tenants.deletedAt));
    const totalTenants = allTenants.length;
    const activeTenants = allTenants.filter(t => t.isActive).length;

    // 2. Total Users
    const [usersRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt));
    const totalUsers = Number(usersRes?.count || 0);

    // 3. Total Orders count & value
    const [ordersRes] = await db
      .select({ 
        count: sql<number>`count(*)`,
        revenue: sql<string>`sum(cast(total as decimal))`
      })
      .from(orders);

    const totalOrdersProcessed = Number(ordersRes?.count || 0);
    const platformGMV = parseFloat(ordersRes?.revenue || '0');

    // 4. Plan breakdown
    const planBreakdown = {
      FREE: allTenants.filter(t => t.plan === 'FREE').length,
      STARTER: allTenants.filter(t => t.plan === 'STARTER').length,
      GROWTH: allTenants.filter(t => t.plan === 'GROWTH').length,
      ENTERPRISE: allTenants.filter(t => t.plan === 'ENTERPRISE').length,
    };

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrdersProcessed,
      platformGMV,
      planBreakdown,
    };
  }

  /**
   * Retrieve system-wide mutating logs.
   */
  async getAuditLogs() {
    return await db
      .select({
        id: auditLogs.id,
        method: auditLogs.method,
        path: auditLogs.path,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .innerJoin(tenants, eq(auditLogs.tenantId, tenants.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
  }
}
