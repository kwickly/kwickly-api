import { eq, and, isNull, between, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { payrollRuns, salarySlips } from '../../db/schema/payroll.ts';
import { staffProfiles } from '../../db/schema/staff.ts';
import { timesheets } from '../../db/schema/timesheets.ts';

export class PayrollService {
  /**
   * Fetch all payroll runs for a tenant
   */
  async getPayrollRuns(tenantId: string) {
    return await db.query.payrollRuns.findMany({
      where: eq(payrollRuns.tenantId, tenantId),
      orderBy: (pr, { desc }) => [desc(pr.periodStartDate)],
      with: {
        slips: true
      }
    });
  }

  /**
   * Fetch specific payroll run with all detailed slips
   */
  async getPayrollRun(id: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, id),
      with: {
        slips: {
          with: {
            staff: {
              columns: { name: true, email: true }
            }
          }
        }
      }
    });
    if (!run) throw new Error('Payroll run not found');
    return run;
  }

  /**
   * Generate payroll for a given period
   */
  async generatePayroll(tenantId: string, payload: {
    periodStartDate: string;
    periodEndDate: string;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Create payroll run
      const [run] = await tx
        .insert(payrollRuns)
        .values({
          tenantId,
          periodStartDate: payload.periodStartDate,
          periodEndDate: payload.periodEndDate,
          status: 'DRAFT'
        })
        .returning();

      if (!run) throw new Error('Failed to create payroll run');

      // 2. Find all active staff
      const staffList = await tx
        .select()
        .from(staffProfiles)
        .where(and(eq(staffProfiles.tenantId, tenantId), isNull(staffProfiles.deletedAt)))
        .execute();

      // 3. Fetch all approved timesheets for the period
      const allTimesheets = await tx
        .select()
        .from(timesheets)
        .where(
          and(
            eq(timesheets.tenantId, tenantId),
            eq(timesheets.status, 'APPROVED'),
            between(timesheets.clockIn, new Date(payload.periodStartDate), new Date(new Date(payload.periodEndDate).getTime() + 86400000))
          )
        )
        .execute();

      // Group by staffId
      const tsByStaff = allTimesheets.reduce((acc, ts) => {
        if (!acc[ts.staffId]) acc[ts.staffId] = [];
        acc[ts.staffId].push(ts);
        return acc;
      }, {} as Record<string, typeof allTimesheets>);

      const slipsData = [];

      // 4. Calculate salary for each staff
      for (const staff of staffList) {
        const staffTs = tsByStaff[staff.userId] || [];
        
        let standardHours = 0;
        let overtimeHours = 0;

        staffTs.forEach(ts => {
          if (ts.totalHours) {
            const h = Number(ts.totalHours);
            if (h > 8) {
              standardHours += 8;
              overtimeHours += (h - 8);
            } else {
              standardHours += h;
            }
          }
        });

        let baseAmount = 0;
        let overtimeAmount = 0;
        const rate = parseFloat(staff.hourlyRate || '0');

        if (staff.salaryType === 'MONTHLY') {
          baseAmount = parseFloat(staff.baseSalary || '0');
          // For salaried, overtime is still paid at standard rate unless otherwise specified
          overtimeAmount = overtimeHours * rate;
        } else if (staff.salaryType === 'HOURLY') {
          baseAmount = standardHours * rate;
          overtimeAmount = overtimeHours * rate * 1.5; // Overtime is 1.5x
        }

        const netPayable = baseAmount + overtimeAmount;

        slipsData.push({
          tenantId,
          payrollRunId: run.id,
          staffId: staff.userId,
          baseAmount: baseAmount.toFixed(2),
          overtimeAmount: overtimeAmount.toFixed(2),
          deductions: '0.00',
          bonus: '0.00',
          netPayable: netPayable.toFixed(2),
          status: 'DRAFT' as const
        });
      }

      if (slipsData.length > 0) {
        await tx.insert(salarySlips).values(slipsData).execute();
      }

      return run;
    });
  }

  /**
   * Adjust bonus and deductions on a draft slip
   */
  async updateSalarySlip(slipId: string, payload: { bonus?: number; deductions?: number }) {
    const slip = await db.query.salarySlips.findFirst({ where: eq(salarySlips.id, slipId) });
    if (!slip) throw new Error('Slip not found');
    if (slip.status !== 'DRAFT') throw new Error('Only DRAFT slips can be adjusted');

    const bonus = payload.bonus !== undefined ? payload.bonus : Number(slip.bonus);
    const deductions = payload.deductions !== undefined ? payload.deductions : Number(slip.deductions);
    
    const base = Number(slip.baseAmount);
    const ot = Number(slip.overtimeAmount);
    
    const netPayable = (base + ot + bonus) - deductions;

    const [updated] = await db.update(salarySlips).set({
      bonus: bonus.toFixed(2),
      deductions: deductions.toFixed(2),
      netPayable: netPayable.toFixed(2),
      updatedAt: new Date()
    }).where(eq(salarySlips.id, slipId)).returning();

    return updated;
  }

  /**
   * Advance Payroll State
   */
  async advancePayrollStatus(runId: string, newStatus: 'PROCESSED' | 'PAID') {
    const [updatedRun] = await db.update(payrollRuns)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(payrollRuns.id, runId))
      .returning();
      
    if (!updatedRun) throw new Error("Run not found");

    if (newStatus === 'PAID') {
      await db.update(salarySlips)
        .set({ status: 'PAID', updatedAt: new Date() })
        .where(eq(salarySlips.payrollRunId, runId));
    }

    return updatedRun;
  }
}
