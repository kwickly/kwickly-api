import { Elysia, t } from 'elysia';
import { LeaveService } from './leave.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { checkPermission } from '../auth/rbac.guard.ts';

const leaveService = new LeaveService();

export const leaveController = new Elysia({ prefix: '/v1/leave' })
  .use(requireAuth)

  // ─── Public Holidays ────────────────────────────────────────────────────────
  .get('/holidays', async ({ user, set }) => {
    if (!user || !user.tenantId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized: Tenant context missing' };
    }
    const data = await leaveService.getHolidays(user.tenantId);
    return { success: true, data };
  })
  .post('/holidays', async ({ user, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized: Tenant context missing' };
    }
    const data = await leaveService.declareHoliday(user.tenantId, body);
    return { success: true, data };
  }, {
    beforeHandle: [checkPermission('attendance:manage')],
    body: t.Object({
      name: t.String(),
      date: t.String(),
    })
  })
  .delete('/holidays/:id', async ({ params }) => {
    const data = await leaveService.removeHoliday(params.id);
    return { success: true, data };
  }, {
    beforeHandle: [checkPermission('attendance:manage')],
  })

  // ─── Staff Leaves ───────────────────────────────────────────────────────────
  .get('/', async ({ user, set }) => {
    if (!user || !user.tenantId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized: Tenant context missing' };
    }
    // Managers can see all leaves, staff can only see their own
    if (user.roleDetails?.permissions?.includes('attendance:manage') || user.role === 'platform_owner' || user.role === 'tenant_owner' || user.role === 'super_admin') {
      const data = await leaveService.getLeaves(user.tenantId);
      return { success: true, data };
    } else {
      const data = await leaveService.getStaffLeaves(user.id);
      return { success: true, data };
    }
  })
  .post('/', async ({ user, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized: Tenant context missing' };
    }
    const data = await leaveService.requestLeave(user.tenantId, user.id, body);
    return { success: true, data };
  }, {
    body: t.Object({
      leaveType: t.Union([t.Literal('SICK'), t.Literal('VACATION'), t.Literal('UNPAID')]),
      startDate: t.String(),
      endDate: t.String(),
    })
  })
  .patch('/:id/status', async ({ params, body }) => {
    const data = await leaveService.updateLeaveStatus(params.id, body.status);
    return { success: true, data };
  }, {
    beforeHandle: [checkPermission('attendance:manage')],
    body: t.Object({
      status: t.Union([t.Literal('APPROVED'), t.Literal('REJECTED')]),
    })
  });
