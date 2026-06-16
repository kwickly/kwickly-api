import { eq, and, isNull, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { staffProfiles } from '../../db/schema/staff';
import { users } from '../../db/schema/users';

export class StaffService {
  /**
   * Fetch staff profiles with user details
   */
  async getStaff(tenantId: string) {
    return await db.select({
      id: users.id,
      name: users.name,
      role: users.role,
      branchId: users.branchId,
      phone: users.phone,
      isActive: users.isActive,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        inArray(users.role, ['manager', 'cashier', 'kitchen_staff', 'qr_scanner']),
        isNull(users.deletedAt)
      )
    );
  }

  /**
   * Register a staff profile and underlying user
   */
  async registerStaff(tenantId: string, payload: {
    name: string;
    phone: string;
    role: 'manager' | 'cashier' | 'kitchen_staff' | 'qr_scanner';
    branchId?: string;
    salaryType?: 'HOURLY' | 'MONTHLY';
    baseSalary?: string;
    hourlyRate?: string;
  }) {
    // 1. Create the base User
    const [user] = await db.insert(users).values({
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      branchId: payload.branchId,
      tenantId,
    }).returning();

    if (!user) throw new Error('Failed to create staff user');

    // 2. Generate a unique token for the digital ID
    const token = crypto.randomBytes(16).toString('hex');

    // 3. Create the Staff Profile (HR)
    const [profile] = await db.insert(staffProfiles).values({
        tenantId,
        userId: user.id,
        joiningDate: new Date().toISOString(),
        salaryType: payload.salaryType || 'HOURLY',
        baseSalary: payload.baseSalary,
        hourlyRate: payload.hourlyRate,
        digitalIdToken: token,
      }).returning();
      
    if (!profile) throw new Error('Failed to create staff profile');
    
    return { ...user, profile };
  }
}
