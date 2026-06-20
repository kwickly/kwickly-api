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
  async updateRolePermissions(tenantId: string | null, roleId: string, permissionSlugs: string[], requestingUser: any) {
    // 0. Prevent Privilege Escalation
    if (requestingUser && requestingUser.role !== 'platform_owner' && requestingUser.role !== 'tenant_owner' && requestingUser.role !== 'super_admin') {
      const userPermissions = requestingUser.roleDetails?.permissions || [];
      const hasAllRequired = permissionSlugs.every(slug => userPermissions.includes(slug));
      if (!hasAllRequired) {
        throw new Error('403: Privilege escalation detected - you cannot assign permissions you do not possess.');
      }
    }
    // 1. Fetch the target role details
    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!roleRecord) throw new Error('Role not found');

    // 2. Get permission IDs for the slugs
    const perms = await db.query.permissions.findMany({
      where: inArray(permissions.slug, permissionSlugs)
    });

    const permissionIds = perms.map(p => p.id);

    let targetRoleId = roleId;

    // 3. Fork-on-Write: If the role is a system role (tenantId is null), fork it
    if (roleRecord.tenantId === null) {
      // Check if this tenant already has a customized fork for this role slug
      let forkedRole = await db.query.roles.findFirst({
        where: and(
          eq(roles.slug, roleRecord.slug),
          eq(roles.tenantId, tenantId)
        )
      });

      if (!forkedRole) {
        // Create custom tenant role fork
        const [newRole] = await db.insert(roles).values({
          tenantId,
          name: roleRecord.name,
          slug: roleRecord.slug,
          isSystem: false
        }).returning();
        forkedRole = newRole;
      }

      if (!forkedRole) throw new Error('Failed to fork role');
      targetRoleId = forkedRole.id;
    }

    // 4. Transactionally update role_permissions
    await db.transaction(async (tx) => {
      // Remove existing
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, targetRoleId));
      
      // Add new
      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map(permissionId => ({ roleId: targetRoleId, permissionId }))
        );
      }
    });

    // 5. Invalidate Redis Cache
    const cacheKey = `rbac:permissions:role:${roleRecord.slug}:${tenantId}`;
    await redis.del(cacheKey);

    return { success: true, forked: targetRoleId !== roleId, roleId: targetRoleId };
  }
  /**
   * Fetch staff profiles with user details
   */
  async getStaff(tenantId: string) {
    return await db.select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
      role: users.role,
      roleId: users.roleId,
      roleName: roles.name,
      isActive: users.isActive,
      salaryType: staffProfiles.salaryType,
      baseSalary: staffProfiles.baseSalary,
      hourlyRate: staffProfiles.hourlyRate,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(
      and(
        eq(users.tenantId, tenantId),
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
    roleId: string;
    branchId?: string;
    salaryType?: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // 1. Create the base User
    const [user] = await db.insert(users).values({
      name: payload.name,
      phone: payload.phone,
      role: 'staff',
      roleId: payload.roleId,
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

  /**
   * Update an employee user and salary profile.
   */
  async updateStaff(tenantId: string, staffId: string, payload: {
    name?: string;
    phone?: string;
    roleId?: string;
    branchId?: string;
    isActive?: boolean;
    salaryType?: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // 1. Update user record
    let updatedUser;
    if (payload.name !== undefined || payload.phone !== undefined || payload.roleId !== undefined || payload.isActive !== undefined || payload.branchId !== undefined) {
      const result = await db.update(users).set({
        name: payload.name,
        phone: payload.phone,
        roleId: payload.roleId,
        branchId: payload.branchId,
        isActive: payload.isActive,
        updatedAt: new Date(),
      }).where(and(eq(users.id, staffId), eq(users.tenantId, tenantId))).returning();
      updatedUser = result[0];
    } else {
      const [u] = await db.select().from(users).where(and(eq(users.id, staffId), eq(users.tenantId, tenantId)));
      updatedUser = u;
    }

    if (!updatedUser) throw new Error('Staff member not found or unauthorized');

    // 2. Update staff profile
    const [updatedProfile] = await db
      .update(staffProfiles)
      .set({
        salaryType: payload.salaryType,
        baseSalary: payload.baseSalary,
        hourlyRate: payload.hourlyRate,
        updatedAt: new Date(),
      })
      .where(and(eq(staffProfiles.userId, staffId), eq(staffProfiles.tenantId, tenantId)))
      .returning();

    return { ...updatedUser, profile: updatedProfile };
  }

  /**
   * Soft delete a staff member.
   */
  async deleteStaff(tenantId: string, staffId: string) {
    const [deleted] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(eq(users.id, staffId), eq(users.tenantId, tenantId)))
      .returning();

    return deleted;
  }

  /**
   * Delete a custom role. System roles cannot be deleted.
   */
  async deleteRole(tenantId: string | null, roleId: string, requestingUser: any) {
    if (requestingUser && requestingUser.role !== 'platform_owner' && requestingUser.role !== 'tenant_owner' && requestingUser.role !== 'super_admin') {
      throw new Error('Only owners can delete roles');
    }

    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!roleRecord) throw new Error('Role not found');
    
    // Cannot delete system roles unless it is a platform owner/super admin doing it globally (tenantId = null)
    if (roleRecord.isSystem && tenantId !== null) {
      throw new Error('System roles cannot be deleted. You can only modify their permissions.');
    }

    if (tenantId !== null && roleRecord.tenantId !== tenantId) {
       throw new Error('You can only delete roles belonging to your tenant');
    }

    // Check if any users are assigned to this role
    const usersWithRole = await db.select({ id: users.id }).from(users).where(eq(users.roleId, roleId)).limit(1);
    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role because it is currently assigned to one or more staff members. Please reassign them first.');
    }

    await db.transaction(async (tx) => {
      // 1. Delete associated permissions
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      // 2. Delete the role
      await tx.delete(roles).where(eq(roles.id, roleId));
    });

    const cacheKey = `rbac:permissions:roleId:${roleId}:${tenantId || 'system'}`;
    import('../../shared/redis.ts').then(m => m.invalidateCache(cacheKey)).catch(e => console.error(e));

    return { success: true };
  }
}
