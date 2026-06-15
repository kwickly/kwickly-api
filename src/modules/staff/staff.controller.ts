import { Elysia, t } from 'elysia';
import { StaffService } from './staff.service';
import { requireAuth } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';

const staffService = new StaffService();

export const staffController = new Elysia({ prefix: '/v1/staff' })
  .use(requireAuth)
  .use(requireRoles(['super_admin', 'tenant_owner', 'manager']))

  .get('/', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const staff = await staffService.getStaff(user.tenantId);
    return { success: true, data: staff };
  })

  .post('/', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const staffProfile = await staffService.registerStaff(user.tenantId, body as any);
    return { success: true, data: staffProfile };
  }, {
    body: t.Object({
      userId: t.String(),
      joiningDate: t.String(),
      salaryType: t.Union([t.Literal('HOURLY'), t.Literal('MONTHLY')]),
      baseSalary: t.Optional(t.String()),
      hourlyRate: t.Optional(t.String()),
    })
  });
