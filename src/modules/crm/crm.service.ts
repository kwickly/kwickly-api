import { eq, and, sum } from 'drizzle-orm';
import { db } from '../../db/index';
import { customerProfiles, loyaltyLedgers } from '../../db/schema/crm';

export class CrmService {
  /**
   * Fetch all customers for a tenant.
   * In a real app, we'd join with `users` to get their name/phone.
   */
  async getCustomers(tenantId: string) {
    return await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.tenantId, tenantId))
      .execute();
  }

  /**
   * Get a specific customer profile and calculate their current loyalty balance.
   */
  async getCustomerProfile(tenantId: string, userId: string) {
    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(and(eq(customerProfiles.tenantId, tenantId), eq(customerProfiles.userId, userId)))
      .execute();

    if (!profile) throw new Error('Customer profile not found');

    const result = await db
      .select({ totalPoints: sum(loyaltyLedgers.points) })
      .from(loyaltyLedgers)
      .where(and(eq(loyaltyLedgers.tenantId, tenantId), eq(loyaltyLedgers.userId, userId)))
      .execute();

    return {
      ...profile,
      loyaltyPointsBalance: result[0]?.totalPoints || '0',
    };
  }

  /**
   * Create or update a customer profile (Marketing Opt-in, DOB, etc)
   */
  async upsertCustomerProfile(tenantId: string, userId: string, payload: {
    dateOfBirth?: Date;
    anniversaryDate?: Date;
    marketingOptIn?: boolean;
  }) {
    const [existing] = await db
      .select()
      .from(customerProfiles)
      .where(and(eq(customerProfiles.tenantId, tenantId), eq(customerProfiles.userId, userId)))
      .execute();

    if (existing) {
      const [updated] = await db
        .update(customerProfiles)
        .set({
          dateOfBirth: payload.dateOfBirth,
          anniversaryDate: payload.anniversaryDate,
          marketingOptIn: payload.marketingOptIn,
          updatedAt: new Date(),
        })
        .where(eq(customerProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(customerProfiles)
        .values({
          tenantId,
          userId,
          dateOfBirth: payload.dateOfBirth,
          anniversaryDate: payload.anniversaryDate,
          marketingOptIn: payload.marketingOptIn ?? false,
        })
        .returning();
      return inserted;
    }
  }

  /**
   * Adjust loyalty points manually or programmatically
   */
  async adjustLoyaltyPoints(tenantId: string, userId: string, points: string, reason: string, orderId?: string) {
    const [ledger] = await db
      .insert(loyaltyLedgers)
      .values({
        tenantId,
        userId,
        points,
        reason,
        orderId,
      })
      .returning();

    return ledger;
  }
}
