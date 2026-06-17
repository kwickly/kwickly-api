import { eq, and, isNull, inArray, or } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { staffProfiles } from '../../db/schema/staff.ts';
import { users } from '../../db/schema/users.ts';
import { roles, rolePermissions, permissions } from '../../db/schema/rbac.ts';
import { redis } from '../../shared/redis.ts';

export class StaffService {
  /**
   * Fetch roles available for a tenant (System + Custom)
   */
  async getRoles(tenantId: string) {
    const allRoles = await db.query.roles.findMany({
      where: or(
        eq(roles.tenantId, tenantId),
        isNull(roles.tenantId)
      ),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    return allRoles.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      permissions: r.permissions.map(p => p.permission.slug)
    }));
  }

  /**
   * Update permissions for a specific role and invalidate cache
   */
  async updateRolePermissions(roleId: string, permissionSlugs: string[]) {
    // 1. Get permission IDs for the slugs
    const perms = await db.query.permissions.findMany({
      where: inArray(permissions.slug, permissionSlugs)
    });

    const permissionIds = perms.map(p => p.id);

    // 2. Transactionally update role_permissions
    await db.transaction(async (tx) => {
      // Remove existing
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      // Add new
      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map(permissionId => ({ roleId, permissionId }))
        );
      }
    });

    // 3. Invalidate Redis Cache
    const roleRecord = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
    if (roleRecord) {
      const cacheKey = `rbac:permissions:role:${roleRecord.slug}:${roleRecord.tenantId || 'system'}`;
      await redis.del(cacheKey);
    }

    return { success: true };
  }
  /**
   * Fetch staff profiles with user details
   */
  async getStaff(tenantId: string) {
    return await db.select({
      id: users.id,
      name: users.name,
      role: users.role,
      branchId: users.branchId,
      phone: users.phone,
      isActive: users.isActive,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        inArray(users.role, ['manager', 'cashier', 'kitchen_staff', 'qr_scanner']),
        isNull(users.deletedAt)
      )
    );
  }

  /**
   * Register a staff profile and underlying user
   */
  async registerStaff(tenantId: string, payload: {
    name: string;
    phone: string;
    role: 'manager' | 'cashier' | 'kitchen_staff' | 'qr_scanner';
    branchId?: string;
    salaryType?: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // 1. Create the base User
    const [user] = await db.insert(users).values({
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      branchId: payload.branchId,
      tenantId,
    }).returning();

    if (!user) throw new Error('Failed to create staff user');

    // 2. Generate a unique token for the digital ID
    const token = crypto.randomBytes(16).toString('hex');

    // 3. Create the Staff Profile (HR)
    const [profile] = await db.insert(staffProfiles).values({
        tenantId,
        userId: user.id,
        joiningDate: new Date().toISOString(),
        salaryType: payload.salaryType || 'HOURLY',
        baseSalary: payload.baseSalary,
        hourlyRate: payload.hourlyRate,
        digitalIdToken: token,
      }).returning();
      
    if (!profile) throw new Error('Failed to create staff profile');
    
    return { ...user, profile };
  }
}
