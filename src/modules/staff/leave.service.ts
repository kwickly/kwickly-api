import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { staffLeaves, publicHolidays } from '../../db/schema/staff.ts';
import { tenants } from '../../db/schema/tenants.ts';

export class LeaveService {
  /**
   * Public Holidays
   */
  async getHolidays(tenantId: string) {
    return await db.query.publicHolidays.findMany({
      where: eq(publicHolidays.tenantId, tenantId),
      orderBy: (ph, { asc }) => [asc(ph.date)],
    });
  }

  async declareHoliday(tenantId: string, payload: { name: string; date: string }) {
    const [holiday] = await db.insert(publicHolidays).values({
      tenantId,
      name: payload.name,
      date: payload.date,
    }).onConflictDoUpdate({
      target: [publicHolidays.tenantId, publicHolidays.date],
      set: { name: payload.name }
    }).returning();
    return holiday;
  }

  async removeHoliday(id: string) {
    await db.delete(publicHolidays).where(eq(publicHolidays.id, id));
    return { success: true };
  }

  /**
   * Staff Leaves
   */
  async getLeaves(tenantId: string) {
    return await db.query.staffLeaves.findMany({
      where: eq(staffLeaves.tenantId, tenantId),
      orderBy: (sl, { desc }) => [desc(sl.createdAt)],
      with: {
        staff: {
          columns: { name: true, email: true }
        }
      }
    });
  }

  async getStaffLeaves(staffId: string) {
    return await db.query.staffLeaves.findMany({
      where: eq(staffLeaves.staffId, staffId),
      orderBy: (sl, { desc }) => [desc(sl.createdAt)],
    });
  }

  async requestLeave(tenantId: string, staffId: string, payload: {
    leaveType: 'SICK' | 'VACATION' | 'UNPAID';
    startDate: string;
    endDate: string;
  }) {
    // 1. Check if it's a paid leave request
    if (payload.leaveType !== 'UNPAID') {
      // Get the tenant's annual paid leave limit
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId)
      });
      const limit = parseInt(tenant?.annualPaidLeaveLimit || '15');

      // Calculate already taken paid leaves this year
      const currentYear = new Date().getFullYear();
      const existingLeaves = await db.query.staffLeaves.findMany({
        where: and(
          eq(staffLeaves.staffId, staffId),
          eq(staffLeaves.status, 'APPROVED')
        )
      });
      
      const paidDaysTaken = existingLeaves
        .filter(l => l.leaveType !== 'UNPAID' && new Date(l.startDate).getFullYear() === currentYear)
        .reduce((acc, l) => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return acc + diffDays;
        }, 0);

      // Calculate requested days
      const requestedStart = new Date(payload.startDate);
      const requestedEnd = new Date(payload.endDate);
      const requestedDays = Math.ceil(Math.abs(requestedEnd.getTime() - requestedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // If exceeding limit, auto convert to UNPAID
      if (paidDaysTaken + requestedDays > limit) {
        payload.leaveType = 'UNPAID';
      }
    }

    const [leave] = await db.insert(staffLeaves).values({
      tenantId,
      staffId,
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'PENDING'
    }).returning();
    
    return leave;
  }

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const [leave] = await db.update(staffLeaves)
      .set({ status })
      .where(eq(staffLeaves.id, id))
      .returning();
    return leave;
  }
}
