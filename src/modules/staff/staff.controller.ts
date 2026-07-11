import { Elysia, t } from 'elysia';
import { StaffService } from './staff.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { checkPermission } from '../auth/rbac.guard.ts';
import { DevicesService } from '../devices/devices.service.ts';

const staffService = new StaffService();
const devicesService = new DevicesService();

export const staffController = new Elysia({ prefix: '/v1/staff' })
  .use(requireAuth)

  .get('/', async ({ user, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const staff = await staffService.getStaff(user.tenantId);
    return { success: true, data: staff };
  }, {
    beforeHandle: [checkPermission('staff:read')]
  })

  .post('/', async ({ user, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const staffProfile = await staffService.registerStaff(user.tenantId, body as any);
    return { success: true, data: staffProfile };
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      name: t.String(),
      phone: t.String(),
      roleId: t.String(),
      branchId: t.Optional(t.String()),
      salaryType: t.Optional(t.Union([t.Literal('HOURLY'), t.Literal('MONTHLY')])),
      baseSalary: t.Optional(t.String()),
      hourlyRate: t.Optional(t.String()),
    })
  })

  .get('/permissions', async ({ set }) => {
    const perms = await staffService.getPermissions();
    return { success: true, data: perms };
  }, {
    beforeHandle: [checkPermission('staff:read')]
  })

  .get('/roles', async ({ user, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const roles = await staffService.getRoles(user.tenantId);
    return { success: true, data: roles };
  }, {
    beforeHandle: [checkPermission('staff:read')]
  })

  .post('/roles', async ({ user, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const result = await staffService.createRole(user.tenantId, body.name, body.permissions);
    return result;
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      name: t.String(),
      permissions: t.Array(t.String())
    })
  })

  .patch('/roles/:id', async ({ user, params, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    return await staffService.updateRolePermissions(user.tenantId, params.id, body.permissions, user);
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      permissions: t.Array(t.String())
    })
  })

  .delete('/roles/:id', async ({ user, params, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    return await staffService.deleteRole(user.tenantId, params.id, user);
  }, {
    beforeHandle: [checkPermission('staff:write')]
  })

  .patch('/:id', async ({ user, params, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const updated = await staffService.updateStaff(user.tenantId, params.id, body as any);
    return { success: true, data: updated };
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      roleId: t.Optional(t.String()),
      branchId: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
      salaryType: t.Optional(t.Union([t.Literal('HOURLY'), t.Literal('MONTHLY')])),
      baseSalary: t.Optional(t.String()),
      hourlyRate: t.Optional(t.String()),
    })
  })

  .post('/:id/pin', async ({ user, params, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const updated = await devicesService.setPosPin(user.tenantId, params.id, body.pin);
    return { success: true, message: 'PIN updated successfully' };
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      pin: t.String(),
    })
  })

  .delete('/:id', async ({ user, params, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const deleted = await staffService.deleteStaff(user.tenantId, params.id);
    return { success: true, data: deleted };
  }, {
    beforeHandle: [checkPermission('staff:write')]
  })
  
  .get('/timesheets', async () => {
    return { success: true, data: [] };
  }, {
    beforeHandle: [checkPermission('staff:read')]
  })

  .patch('/timesheets/:id', async ({ body }) => {
    return { success: true, data: { id: 'stub', status: body.status } };
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      status: t.Union([t.Literal('APPROVED'), t.Literal('REJECTED')])
    })
  });
