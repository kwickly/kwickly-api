import { Elysia, t } from 'elysia';
import { AttendanceService } from './attendance.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const attendanceService = new AttendanceService();

export const attendanceController = new Elysia({ prefix: '/v1/attendance' })
  .use(requireAuth)
  
  // Staff app scans the branch QR to clock in/out (Any authenticated user can scan)
  .post('/staff/scan', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const result = await attendanceService.scanDutyQR(user.tenantId, user.sub, body.qrData);
    return result;
  }, {
    body: t.Object({
      qrData: t.String(),
    })
  })

  // From here down, requires Manager/Admin privileges
  .use(requirePermission('attendance:manage'))

  // Manager gets the branch QR string to print
  .get('/branch-qr/:branchId', async ({ user, params }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const qrBase64 = await attendanceService.generateBranchQR(user.tenantId, params.branchId);
    return { success: true, qr: qrBase64 };
  }, {
    params: t.Object({
      branchId: t.String(),
    })
  });
