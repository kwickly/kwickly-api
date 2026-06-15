import { eq, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { staffAttendance } from '../../db/schema/staff';
import { branches } from '../../db/schema/branches';

export class AttendanceService {
  /**
   * Generates a static payload for the branch.
   * This payload can be converted into a QR code and printed on a wall.
   */
  async generateBranchQR(tenantId: string, branchId: string) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)))
      .execute();

    if (!branch) throw new Error('Branch not found.');

    // In a real scenario, use a secret stored in environment variables or branch settings
    const STATIC_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
    
    const payload = {
      type: 'STAFF_DUTY',
      branchId: branch.id,
      tenantId: branch.tenantId,
    };

    const sig = crypto.createHmac('sha256', STATIC_SECRET).update(JSON.stringify(payload)).digest('hex');

    return Buffer.from(JSON.stringify({ ...payload, sig })).toString('base64');
  }

  /**
   * Staff scans the branch QR to clock in or clock out.
   */
  async scanDutyQR(tenantId: string, staffId: string, qrBase64: string) {
    let payload;
    try {
      const decoded = Buffer.from(qrBase64, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (err) {
      throw new Error('Invalid QR format.');
    }

    const { type, branchId, sig } = payload;
    if (type !== 'STAFF_DUTY' || !branchId || !sig) {
      throw new Error('Malformed or incorrect QR code.');
    }

    // Verify signature
    const STATIC_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
    const rawPayload = { type, branchId, tenantId: payload.tenantId };
    const expectedSig = crypto.createHmac('sha256', STATIC_SECRET).update(JSON.stringify(rawPayload)).digest('hex');

    if (sig !== expectedSig) {
      throw new Error('QR signature mismatch.');
    }

    // Check if the staff already has an open clock-in (null clockOutAt)
    const [openSession] = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.staffId, staffId),
          eq(staffAttendance.tenantId, tenantId),
          isNull(staffAttendance.clockOutAt)
        )
      )
      .execute();

    if (openSession) {
      // CLOCK OUT
      const clockOutTime = new Date();
      const diffMs = clockOutTime.getTime() - openSession.clockInAt.getTime();
      const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

      await db
        .update(staffAttendance)
        .set({
          clockOutAt: clockOutTime,
          totalHours,
        })
        .where(eq(staffAttendance.id, openSession.id))
        .execute();

      return { success: true, action: 'clock_out', hours: totalHours };
    } else {
      // CLOCK IN
      await db
        .insert(staffAttendance)
        .values({
          tenantId,
          branchId,
          staffId,
          clockInAt: new Date(),
        })
        .execute();

      return { success: true, action: 'clock_in' };
    }
  }
}
