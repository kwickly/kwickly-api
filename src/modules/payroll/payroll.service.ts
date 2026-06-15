import { eq, and, isNull, between, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { payrollRuns, salarySlips } from '../../db/schema/payroll';
import { staffProfiles, staffAttendance } from '../../db/schema/staff';

export class PayrollService {
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
        })
        .returning();

      if (!run) throw new Error('Failed to create payroll run');

      // 2. Find all active staff
      const staffList = await tx
        .select()
        .from(staffProfiles)
        .where(and(eq(staffProfiles.tenantId, tenantId), isNull(staffProfiles.deletedAt)))
        .execute();

      const slipsData = [];

      // 3. Calculate salary for each staff
      for (const staff of staffList) {
        let netPayable = 0;

        if (staff.salaryType === 'MONTHLY') {
          netPayable = parseFloat(staff.baseSalary || '0');
        } else if (staff.salaryType === 'HOURLY') {
          // Aggregate total hours in this period
          const attendance = await tx
            .select({
              totalHours: sql`SUM(CAST(${staffAttendance.totalHours} AS numeric))`
            })
            .from(staffAttendance)
            .where(
              and(
                eq(staffAttendance.staffId, staff.userId),
                eq(staffAttendance.tenantId, tenantId),
                between(staffAttendance.clockInAt, new Date(payload.periodStartDate), new Date(payload.periodEndDate))
              )
            )
            .execute();
            
          const totalHours = parseFloat((attendance[0]?.totalHours as any) || '0');
          const rate = parseFloat(staff.hourlyRate || '0');
          netPayable = totalHours * rate;
        }

        slipsData.push({
          tenantId,
          payrollRunId: run.id,
          staffId: staff.userId,
          baseAmount: netPayable.toString(),
          netPayable: netPayable.toString(),
        });
      }

      if (slipsData.length > 0) {
        await tx.insert(salarySlips).values(slipsData).execute();
      }

      return run;
    });
  }
}
