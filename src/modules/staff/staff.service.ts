import { eq, and, isNull, inArray, or } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { staffProfiles } from '../../db/schema/staff.ts';
import { users } from '../../db/schema/users.ts';
import { roles, rolePermissions, permissions } from '../../db/schema/rbac.ts';
import { timesheets } from '../../db/schema/timesheets.ts';
import { redis } from '../../shared/redis.ts';

export class StaffService {
  /**
   * Fetch all available granular permissions in the system.
   */
  async getPermissions() {
    const allPerms = await db.query.permissions.findMany();
    return allPerms.map(p => ({ id: p.id, name: p.name, slug: p.slug, description: p.description }));
  }

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
   * Create a new custom role for a tenant
   */
  async createRole(tenantId: string, name: string, permissionSlugs: string[]) {
    // Generate a unique slug based on the name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    let slug = baseSlug;
    
    // Ensure slug uniqueness for this tenant
    const existing = await db.query.roles.findFirst({
      where: and(eq(roles.slug, slug), eq(roles.tenantId, tenantId))
    });
    
    if (existing) {
      slug = `${baseSlug}_${Math.floor(Math.random() * 10000)}`;
    }

    let newRoleId: string;

    await db.transaction(async (tx) => {
      const [newRole] = await tx.insert(roles).values({
        tenantId,
        name,
        slug,
        isSystem: false
      }).returning();
      
      if (!newRole) throw new Error('Failed to create role');
      newRoleId = newRole.id;

      if (permissionSlugs.length > 0) {
        const perms = await tx.query.permissions.findMany({
          where: inArray(permissions.slug, permissionSlugs)
        });

        if (perms.length > 0) {
          await tx.insert(rolePermissions).values(
            perms.map(p => ({ roleId: newRoleId, permissionId: p.id }))
          );
        }
      }
    });

    return { success: true, roleId: newRoleId! };
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
          tenantId ? eq(roles.tenantId, tenantId) : isNull(roles.tenantId)
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
        forkedRole = newRole!;
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
      pin: users.posPin,
      status: users.status,
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
    status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
    salaryType?: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // 1. Update user record
    let updatedUser;
    if (payload.name !== undefined || payload.phone !== undefined || payload.roleId !== undefined || payload.status !== undefined || payload.branchId !== undefined) {
      const result = await db.update(users).set({
        name: payload.name,
        phone: payload.phone,
        roleId: payload.roleId,
        branchId: payload.branchId,
        status: payload.status,
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
        status: 'TERMINATED',
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
    import('../../shared/redis.ts').then(m => m.redis.del(cacheKey)).catch(e => console.error(e));

    return { success: true };
  }

  /**
   * Fetch timesheets
   */
  async getPlatformTimesheets(params: { limit?: number; offset?: number } = {}) {
    const records = await db.query.timesheets.findMany({
      limit: params.limit || 50,
      offset: params.offset || 0,
      orderBy: (ts, { desc }) => [desc(ts.createdAt)],
      with: {
        staff: {
          columns: { name: true, role: true, email: true }
        },
        branch: {
          columns: { name: true }
        },
        reviewer: {
          columns: { name: true }
        }
      }
    });

    return records;
  }

  /**
   * Fetch timesheets for a specific tenant
   */
  async getTenantTimesheets(tenantId: string) {
    const records = await db.query.timesheets.findMany({
      where: eq(timesheets.tenantId, tenantId),
      orderBy: (ts, { desc }) => [desc(ts.createdAt)],
      with: {
        staff: {
          columns: { name: true, role: true, email: true }
        },
        reviewer: {
          columns: { name: true }
        }
      }
    });

    return records.map(r => ({
      id: r.id,
      staffId: r.staffId,
      staffName: r.staff.name,
      clockIn: r.clockIn,
      clockOut: r.clockOut,
      status: r.status,
      totalHours: r.totalHours ? Number(r.totalHours) : 0,
      reviewerNotes: r.reviewerNotes
    }));
  }

  /**
   * Staff clock in
   */
  async clockIn(tenantId: string, staffId: string) {
    // Check if staff already has an open timesheet
    const existing = await db.query.timesheets.findFirst({
      where: and(
        eq(timesheets.tenantId, tenantId),
        eq(timesheets.staffId, staffId),
        isNull(timesheets.clockOut)
      )
    });

    if (existing) {
      throw new Error('Staff member is already clocked in');
    }

    const [newTs] = await db.insert(timesheets).values({
      tenantId,
      staffId,
      clockIn: new Date(),
      status: 'PENDING'
    }).returning();

    return newTs;
  }

  /**
   * Staff clock out
   */
  async clockOut(tenantId: string, staffId: string) {
    // Find the open timesheet
    const existing = await db.query.timesheets.findFirst({
      where: and(
        eq(timesheets.tenantId, tenantId),
        eq(timesheets.staffId, staffId),
        isNull(timesheets.clockOut)
      )
    });

    if (!existing) {
      throw new Error('No open timesheet found to clock out from');
    }

    const clockOutTime = new Date();
    const diffMs = clockOutTime.getTime() - existing.clockIn.getTime();
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    const [updatedTs] = await db.update(timesheets).set({
      clockOut: clockOutTime,
      totalHours,
      updatedAt: new Date()
    })
    .where(eq(timesheets.id, existing.id))
    .returning();

    return updatedTs;
  }

  /**
   * Update timesheet status and remarks
   */
  async updateTimesheet(id: string, payload: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewerNotes?: string;
    reviewedBy: string;
  }) {
    if (payload.status === 'REJECTED' && !payload.reviewerNotes?.trim()) {
      throw new Error('A rejection remark is required');
    }

    const [updated] = await db.update(timesheets).set({
      status: payload.status,
      reviewerNotes: payload.reviewerNotes || null,
      reviewedBy: payload.reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(timesheets.id, id))
    .returning();

    if (!updated) {
      throw new Error('Timesheet not found');
    }

    return updated;
  }
}
