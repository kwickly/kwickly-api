import { Elysia, t } from 'elysia';
import { PayrollService } from './payroll.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const payrollService = new PayrollService();

export const payrollController = new Elysia({ prefix: '/v1/payroll' })
  .use(requireAuth)
  .use(requirePermission('payroll:manage'))

  .post('/run', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const run = await payrollService.generatePayroll(user.tenantId, body);
    return { success: true, data: run };
  }, {
    body: t.Object({
      periodStartDate: t.String(),
      periodEndDate: t.String(),
    })
  });
