import { Elysia, t } from 'elysia';
import { PayrollService } from './payroll.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const payrollService = new PayrollService();

export const payrollController = new Elysia({ prefix: '/v1/payroll' })
  .use(requireAuth)
  .use(requirePermission('payroll:manage'))

  // List payroll runs
  .get('/', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const data = await payrollService.getPayrollRuns(user.tenantId);
    return { success: true, data };
  })

  // Get specific run with slips
  .get('/:id', async ({ params }) => {
    const data = await payrollService.getPayrollRun(params.id);
    return { success: true, data };
  })

  // Generate new run
  .post('/run', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const data = await payrollService.generatePayroll(user.tenantId, body);
    return { success: true, data };
  }, {
    body: t.Object({
      periodStartDate: t.String(),
      periodEndDate: t.String(),
    })
  })

  // Update slip (Bonus/Deductions)
  .patch('/slips/:id', async ({ params, body }) => {
    const data = await payrollService.updateSalarySlip(params.id, body);
    return { success: true, data };
  }, {
    body: t.Object({
      bonus: t.Optional(t.Number()),
      deductions: t.Optional(t.Number()),
    })
  })

  // Advance Payroll status
  .patch('/:id/status', async ({ params, body }) => {
    const data = await payrollService.advancePayrollStatus(params.id, body.status);
    return { success: true, data };
  }, {
    body: t.Object({
      status: t.Union([t.Literal('PROCESSED'), t.Literal('PAID')])
    })
  });
