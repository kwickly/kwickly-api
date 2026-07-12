import { Elysia, t } from 'elysia';
import { requireAuth, requirePermissions } from '../auth/auth.guard';
import { rolesService } from './roles.service';

export const rolesController = new Elysia({ prefix: '/v1/roles' })
  .use(requireAuth) // Basic auth to get user payload
  
  /**
   * Get all granular permissions available in the system
   */
  .get('/permissions', async () => {
    try {
      const permissions = await rolesService.getAllPermissions();
      return { success: true, data: permissions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  })

  // Read routes (requires staff:read)
  .use(requirePermissions(['staff:read']))
  
  /**
   * Get all roles for the current tenant (including system roles)
   */
  .get('/', async ({ user }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');
      
      const roles = await rolesService.getRoles(tenantId);
      
      // Transform response to be more frontend friendly
      const transformedRoles = roles.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        isSystem: r.isSystem,
        createdAt: r.createdAt,
        permissions: r.permissions.map((p: any) => p.permission),
      }));

      return { success: true, data: transformedRoles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  })
  
  /**
   * Get role by ID
   */
  .get('/:id', async ({ user, params }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');
      
      const role = await rolesService.getRoleById(tenantId, params.id);
      
      const transformedRole = {
        ...role,
        permissions: role.permissions.map((p: any) => p.permission),
      };

      return { success: true, data: transformedRole };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // Write routes (requires staff:write)
  .use(requirePermissions(['staff:write']))

  /**
   * Create a new custom role
   */
  .post('/', async ({ user, body }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');
      
      const role = await rolesService.createRole(tenantId, body.name, body.permissionIds);
      return { success: true, data: role };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      permissionIds: t.Array(t.String()),
    })
  })

  /**
   * Update a custom role
   */
  .put('/:id', async ({ user, params, body }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');
      
      const role = await rolesService.updateRole(tenantId, params.id, body.name, body.permissionIds);
      return { success: true, data: role };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.String(),
      permissionIds: t.Array(t.String()),
    })
  })

  /**
   * Delete a custom role
   */
  .delete('/:id', async ({ user, params }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');
      
      await rolesService.deleteRole(tenantId, params.id);
      return { success: true, message: 'Role deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  });
