import { eq, and, isNull, inArray } from 'drizzle-orm';
import { db } from '../../shared/db';
import type { NewUser } from '../../shared/schema/users';
import { users } from '../../shared/schema/users';

/**
 * Service handling all core business logic for Users/Staff.
 * Exposes methods for listing employees and onboarding new staff securely.
 */
export class UsersService {
  /**
   * Retrieves a list of all active staff members belonging to a specific tenant.
   * Filters out customers and deleted users.
   *
   * @param {string} tenantId - The UUID of the tenant requesting the staff list.
   * @returns {Promise<Partial<User>[]>} A promise resolving to an array of staff members.
   */
  async listStaff(tenantId: string) {
    return db.select({
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
   * Onboards a new staff member (e.g., Manager, Cashier, Kitchen Staff, QR Scanner).
   * Strictly validates that high-privilege roles (like Admin) or Customer roles cannot be created via this method.
   *
   * @param {string} tenantId - The UUID of the tenant the staff belongs to.
   * @param {Omit<NewUser, 'tenantId'>} data - The staff details (name, phone, role, branchId).
   * @returns {Promise<Partial<User>>} A promise resolving to the created staff member.
   * @throws {Error} If the requested role is invalid for staff onboarding.
   */
  async createStaff(tenantId: string, data: Omit<NewUser, 'tenantId'>) {
    // Only allow creating staff roles, not admins/customers
    if (!['manager', 'cashier', 'kitchen_staff', 'qr_scanner'].includes(data.role as string)) {
      throw new Error('Invalid role for staff onboarding');
    }

    const [staff] = await db.insert(users).values({
      ...data,
      tenantId,
    }).returning();

    return staff;
  }
}
