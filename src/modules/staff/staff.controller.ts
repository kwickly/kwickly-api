import { Elysia, t } from 'elysia';
import { StaffService } from './staff.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { checkPermission } from '../auth/rbac.guard.ts';

const staffService = new StaffService();

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
      role: t.Union([
        t.Literal('manager'),
        t.Literal('cashier'),
        t.Literal('kitchen_staff'),
        t.Literal('qr_scanner')
      ]),
      branchId: t.Optional(t.String()),
      salaryType: t.Optional(t.Union([t.Literal('HOURLY'), t.Literal('MONTHLY')])),
      baseSalary: t.Optional(t.String()),
      hourlyRate: t.Optional(t.String()),
    })
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

  .patch('/roles/:id', async ({ params, body }) => {
    return await staffService.updateRolePermissions(params.id, body.permissions);
  }, {
    beforeHandle: [checkPermission('staff:write')],
    body: t.Object({
      permissions: t.Array(t.String())
    })
  })
