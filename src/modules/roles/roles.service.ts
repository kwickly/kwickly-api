import { db } from '../../db';
import { roles, permissions, rolePermissions } from '../../db/schema/rbac';
import { eq, and, isNull, inArray } from 'drizzle-orm';

export class RolesService {
  async getRoles(tenantId: string) {
    // Return both system roles (tenantId = null) and tenant-specific roles
    return await db.query.roles.findMany({
      where: (r, { or, eq, isNull, and }) => 
        and(
          isNull(r.deletedAt),
          or(
            isNull(r.tenantId),
            eq(r.tenantId, tenantId)
          )
        ),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      },
      orderBy: (r, { asc }) => [asc(r.createdAt)]
    });
  }

  async getRoleById(tenantId: string, roleId: string) {
    const role = await db.query.roles.findFirst({
      where: (r, { eq, and, isNull, or }) =>
        and(
          eq(r.id, roleId),
          isNull(r.deletedAt),
          or(
            isNull(r.tenantId),
            eq(r.tenantId, tenantId)
          )
        ),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  async getAllPermissions() {
    return await db.query.permissions.findMany({
      where: isNull(permissions.deletedAt),
      orderBy: (p, { asc }) => [asc(p.name)]
    });
  }

  async createRole(tenantId: string, name: string, permissionIds: string[]) {
    // Only allow creating non-system roles
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    return await db.transaction(async (tx) => {
      // 1. Create Role
      const [newRole] = await tx.insert(roles).values({
        tenantId,
        name,
        slug,
        isSystem: false,
      }).returning();

      if (!newRole) throw new Error('Failed to create role');

      // 2. Assign Permissions
      if (permissionIds.length > 0) {
        const rolePerms = permissionIds.map(pid => ({
          roleId: newRole.id,
          permissionId: pid
        }));
        await tx.insert(rolePermissions).values(rolePerms);
      }

      return this.getRoleById(tenantId, newRole.id);
    });
  }

  async updateRole(tenantId: string, roleId: string, name: string, permissionIds: string[]) {
    return await db.transaction(async (tx) => {
      // Fetch role to ensure it exists and belongs to tenant
      const existingRole = await tx.query.roles.findFirst({
        where: (r, { eq, and, isNull, or }) =>
          and(
            eq(r.id, roleId),
            isNull(r.deletedAt),
            or(
              isNull(r.tenantId),
              eq(r.tenantId, tenantId)
            )
          )
      });

      if (!existingRole) {
        throw new Error('Role not found');
      }

      if (existingRole.isSystem) {
        throw new Error('Cannot modify a system role');
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      // 1. Update Role Name
      await tx.update(roles)
        .set({ name, slug })
        .where(eq(roles.id, roleId));

      // 2. Re-assign Permissions
      // Delete existing
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      // Insert new
      if (permissionIds.length > 0) {
        const rolePerms = permissionIds.map(pid => ({
          roleId,
          permissionId: pid
        }));
        await tx.insert(rolePermissions).values(rolePerms);
      }

      return this.getRoleById(tenantId, roleId);
    });
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await db.query.roles.findFirst({
      where: (r, { eq, and, isNull }) =>
        and(
          eq(r.id, roleId),
          eq(r.tenantId, tenantId),
          isNull(r.deletedAt)
        )
    });

    if (!role) {
      throw new Error('Role not found or you do not have permission to delete it');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete a system role');
    }

    // Soft delete role
    await db.update(roles)
      .set({ deletedAt: new Date() })
      .where(eq(roles.id, roleId));
      
    // Optionally we might want to unassign it from users, or let users fail gracefully
    
    return { success: true };
  }
}

export const rolesService = new RolesService();
