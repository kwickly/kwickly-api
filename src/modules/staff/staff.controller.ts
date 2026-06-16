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

  .get('/timesheets', async () => {
    return {
      success: true,
      data: [
        { id: '1', staffId: '101', staffName: 'Rahul Kumar', clockIn: '2026-06-16T09:00:00Z', clockOut: '2026-06-16T18:00:00Z', status: 'PENDING', totalHours: 9 },
        { id: '2', staffId: '102', staffName: 'Priya Sharma', clockIn: '2026-06-16T10:00:00Z', clockOut: '2026-06-16T17:00:00Z', status: 'APPROVED', totalHours: 7 },
        { id: '3', staffId: '103', staffName: 'John Doe', clockIn: '2026-06-16T08:30:00Z', clockOut: '2026-06-16T18:30:00Z', status: 'REJECTED', totalHours: 10 }
      ]
    };
  })

  .patch('/timesheets/:id', async ({ params, body }) => {
    return {
      success: true,
      data: { id: params.id, status: (body as any).status },
      message: `Timesheet record updated successfully`
    };
  })

  .get('/roles', async () => {
    return {
      success: true,
      data: [
        { role: 'manager', permissions: ['read:orders', 'write:menus', 'manage:billing', 'view:staff'] },
        { role: 'cashier', permissions: ['read:orders', 'view:menus'] },
        { role: 'kitchen_staff', permissions: ['read:orders', 'update:orders'] },
        { role: 'qr_scanner', permissions: ['scan:qr'] }
      ]
    };
  })

  .post('/roles', async ({ body }) => {
    return {
      success: true,
      message: 'Role permissions saved successfully',
      data: body
    };
  });
