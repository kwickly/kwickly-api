import { eq, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { staffProfiles } from '../../db/schema/staff';

export class StaffService {
  /**
   * Fetch staff profiles
   */
  async getStaff(tenantId: string) {
    return await db
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.tenantId, tenantId), isNull(staffProfiles.deletedAt)))
      .execute();
  }

  /**
   * Register a staff profile
   */
  async registerStaff(tenantId: string, payload: {
    userId: string;
    joiningDate: string;
    salaryType: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // Generate a unique token for the digital ID
    const token = crypto.randomBytes(16).toString('hex');

    const [profile] = await db
      .insert(staffProfiles)
      .values({
        tenantId,
        userId: payload.userId,
        joiningDate: payload.joiningDate,
        salaryType: payload.salaryType,
        baseSalary: payload.baseSalary,
        hourlyRate: payload.hourlyRate,
        digitalIdToken: token,
      })
      .returning();
      
    if (!profile) throw new Error('Failed to create staff profile');
    return profile;
  }
}
