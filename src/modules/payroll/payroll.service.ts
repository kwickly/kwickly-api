import { eq, and, isNull, between, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { payrollRuns, salarySlips } from '../../db/schema/payroll.ts';
import { staffProfiles, publicHolidays, staffLeaves } from '../../db/schema/staff.ts';
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
    // 0. Check if a run already exists for this period
    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.tenantId, tenantId),
        eq(payrollRuns.periodStartDate, payload.periodStartDate),
        eq(payrollRuns.periodEndDate, payload.periodEndDate)
      )
    });

    if (existingRun) {
      throw new Error('A payroll run for this exact period already exists.');
    }

    // 1. Create payroll run
    const [run] = await db
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
    const staffList = await db
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.tenantId, tenantId), isNull(staffProfiles.deletedAt)))
      .execute();

    // 3. Fetch all approved timesheets for the period
    const periodStart = new Date(payload.periodStartDate);
    const periodEnd = new Date(new Date(payload.periodEndDate).getTime() + 86400000); // include last day

    const allTimesheets = await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.tenantId, tenantId),
          eq(timesheets.status, 'APPROVED'),
          between(timesheets.clockIn, periodStart, periodEnd)
        )
      )
      .execute();

    // 3a. Fetch Public Holidays
    const holidays = await db.select().from(publicHolidays)
      .where(
        and(
          eq(publicHolidays.tenantId, tenantId),
          between(publicHolidays.date, payload.periodStartDate, payload.periodEndDate)
        )
      ).execute();
    const holidayDates = new Set(holidays.map(h => h.date));

    // 3b. Fetch Unpaid Leaves
    const unpaidLeaves = await db.select().from(staffLeaves)
      .where(
        and(
          eq(staffLeaves.tenantId, tenantId),
          eq(staffLeaves.status, 'APPROVED'),
          eq(staffLeaves.leaveType, 'UNPAID'),
          between(staffLeaves.startDate, payload.periodStartDate, payload.periodEndDate)
        )
      ).execute();

    const leavesByStaff = unpaidLeaves.reduce((acc, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const current = acc[l.staffId] ?? 0;
      acc[l.staffId] = current + diffDays;
      return acc;
    }, {} as Record<string, number>);

    // Group by staffId
    const tsByStaff = allTimesheets.reduce((acc, ts) => {
      const arr = acc[ts.staffId] ?? [];
      arr.push(ts);
      acc[ts.staffId] = arr;
      return acc;
    }, {} as Record<string, typeof allTimesheets>);

    const slipsData = [];

    // 4. Calculate salary for each staff
    for (const staff of staffList) {
      const staffTs = tsByStaff[staff.userId] || [];
      
      let standardHours = 0;
      let overtimeHours = 0;
      let holidayPremiumHours = 0;
      let workedOnHoliday = false;

      staffTs.forEach(ts => {
        if (ts.totalHours) {
          const h = Number(ts.totalHours);
          const tsDateStr = ts.clockIn.toISOString().slice(0, 10);
          const isHoliday = holidayDates.has(tsDateStr);
          
          if (isHoliday) {
            workedOnHoliday = true;
            holidayPremiumHours += h;
          }

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
      let deductionsAmount = 0;
      let bonusAmount = 0;
      const rate = parseFloat(staff.hourlyRate || '0');
      const unpaidLeaveDays = leavesByStaff[staff.userId] || 0;

      if (staff.salaryType === 'MONTHLY') {
        baseAmount = parseFloat(staff.baseSalary || '0');
        // Deduct base pay for unpaid leaves
        const perDayRate = baseAmount / 30; // Assuming 30-day standardized month
        deductionsAmount = perDayRate * unpaidLeaveDays;
        
        overtimeAmount = overtimeHours * rate;
        // Holiday bonus: Extra day's pay
        if (workedOnHoliday) {
          bonusAmount += perDayRate;
        }
      } else if (staff.salaryType === 'HOURLY') {
        baseAmount = standardHours * rate;
        overtimeAmount = overtimeHours * rate * 1.5; // Overtime is 1.5x
        // Holiday bonus: Extra 0.5x for all hours worked on holiday (making it 1.5x total base)
        if (workedOnHoliday) {
          bonusAmount += (holidayPremiumHours * rate * 0.5);
        }
        // Hourly staff don't get deductions for unpaid leaves because they just don't clock in.
      }

      const netPayable = baseAmount + overtimeAmount + bonusAmount - deductionsAmount;

      slipsData.push({
        tenantId,
        payrollRunId: run.id,
        staffId: staff.userId,
        baseAmount: baseAmount.toFixed(2),
        overtimeAmount: overtimeAmount.toFixed(2),
        deductions: deductionsAmount.toFixed(2),
        bonus: bonusAmount.toFixed(2),
        netPayable: netPayable.toFixed(2),
        status: 'DRAFT' as const
      });
    }

    if (slipsData.length > 0) {
      await db.insert(salarySlips).values(slipsData).execute();
    }

    return run;
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
