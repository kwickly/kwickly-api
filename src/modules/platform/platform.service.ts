import { eq, and, isNull, sql, desc, or, ilike } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { tenants, branches, users, orders, auditLogs } from '../../db/schema/index.ts';

export class PlatformService {
  /**
   * List all tenants in the system along with user and branch counts.
   */
  async listTenants(page: number = 1, limit: number = 12, search?: string) {
    const offset = (page - 1) * limit;

    let baseConditions = isNull(tenants.deletedAt);
    if (search) {
      baseConditions = and(
        baseConditions,
        or(
          ilike(tenants.name, `%${search}%`),
          ilike(tenants.slug, `%${search}%`),
          ilike(tenants.email, `%${search}%`)
        )
      ) as any;
    }

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(baseConditions);
    const total = Number(totalRes?.count || 0);

    const allTenants = await db
      .select()
      .from(tenants)
      .where(baseConditions)
      .limit(limit)
      .offset(offset);

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

    return {
      data: result,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
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
    }).returning();

    if (newTenant) {
      await db.insert(require('../../db/schema/index.ts').tenantBranding).values({
        tenantId: newTenant.id,
        brandColor: data.brandColor || '#6366F1',
      });
    }

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
  async getAuditLogs(page: number = 1, limit: number = 50, search?: string) {
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(auditLogs.path, `%${search}%`),
        ilike(users.name, `%${search}%`)
      );
    }

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .innerJoin(tenants, eq(auditLogs.tenantId, tenants.id))
      .where(whereClause);
    const total = Number(totalRes?.count || 0);

    const data = await db
      .select({
        id: auditLogs.id,
        method: auditLogs.method,
        path: auditLogs.path,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        statusCode: auditLogs.statusCode,
        userRole: auditLogs.userRole,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .innerJoin(tenants, eq(auditLogs.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Retrieve platform staff (super_admins and platform_owners).
   */
  async getPlatformStaff() {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          eq(users.role, 'super_admin'),
          eq(users.role, 'platform_owner')
        )
      )
      .orderBy(desc(users.createdAt))
      .execute();
  }

  /**
   * Generate impersonation data for a tenant
   */
  async generateImpersonationToken(adminUserId: string, tenantId: string) {
    // We already know the user is a platform_owner or super_admin from the auth guard
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) throw new Error('Tenant not found');

    const [branding] = await db
      .select()
      .from(require('../../db/schema/index.ts').tenantBranding)
      .where(eq(require('../../db/schema/index.ts').tenantBranding.tenantId, tenantId));

    // Return the data needed by the frontend auth store to mock the tenant context
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      branding: branding || { brandColor: '#6366F1' },
      // Optional token, we just rely on x-impersonate-tenant-id for now
      token: 'impersonation_active',
    };
  }
}
