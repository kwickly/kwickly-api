import { Elysia, t } from 'elysia';
import { PayrollService } from './payroll.service';
import { requireAuth } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';

const payrollService = new PayrollService();

export const payrollController = new Elysia({ prefix: '/v1/payroll' })
  .use(requireAuth)
  .use(requireRoles(['super_admin', 'tenant_owner', 'hr_manager']))

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
