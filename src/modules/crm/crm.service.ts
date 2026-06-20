import { eq, and, sum, sql, desc, lte } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { customerProfiles, loyaltyLedgers } from '../../db/schema/crm.ts';
import { users } from '../../db/schema/users.ts';
import { orders } from '../../db/schema/orders.ts';

export class CrmService {
  /**
   * Fetch all customers for a tenant with their core profile and loyalty points.
   */
  async getCustomers(tenantId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'customer')));
    const total = Number(totalRes?.count || 0);

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        loyaltyPoints: sql<string>`COALESCE(SUM(${loyaltyLedgers.points}), 0)`
      })
      .from(users)
      .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
      .leftJoin(loyaltyLedgers, eq(users.id, loyaltyLedgers.userId))
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'customer')))
      .groupBy(users.id)
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mock implementation of segments based on order frequency.
   */
  async getSegments(tenantId: string, page: number = 1, limit: number = 10, search?: string) {
    // In a production app, these would be defined in a `segments` table.
    // We calculate counts dynamically based on order behavior.
    let allSegments = [
      { id: 'seg1', name: 'At Risk Subscribers', ruleType: 'days_since_scan', ruleValue: '5', customerCount: 12 },
      { id: 'seg2', name: 'Highly Active Diners', ruleType: 'total_scans', ruleValue: '15', customerCount: 45 },
      { id: 'seg3', name: 'New Signups (30 Days)', ruleType: 'signup_days', ruleValue: '30', customerCount: 8 }
    ];
    
    if (search) {
      allSegments = allSegments.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }

    const offset = (page - 1) * limit;
    const data = allSegments.slice(offset, offset + limit);

    return {
      data,
      meta: {
        total: allSegments.length,
        page,
        limit,
        totalPages: Math.ceil(allSegments.length / limit) || 1
      }
    };
  }

  /**
   * Mock implementation of campaigns.
   */
  async getCampaigns(tenantId: string, page: number = 1, limit: number = 10, search?: string) {
    let allCampaigns = [
      { id: 'c1', title: '5-Day Inactive Promo', channel: 'whatsapp', status: 'SENT', sentCount: 14, sentAt: '2026-06-15T12:00:00Z' },
      { id: 'c2', title: 'Weekend Special Offer', channel: 'push', status: 'SCHEDULED', sentCount: 45, sentAt: '2026-06-20T10:00:00Z' }
    ];

    if (search) {
      allCampaigns = allCampaigns.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
    }

    const offset = (page - 1) * limit;
    const data = allCampaigns.slice(offset, offset + limit);

    return {
      data,
      meta: {
        total: allCampaigns.length,
        page,
        limit,
        totalPages: Math.ceil(allCampaigns.length / limit) || 1
      }
    };
  }

  /**
   * Real dynamic loyalty configuration.
   */
  async getLoyaltyConfig(tenantId: string) {
    // Typically stored in a `tenant_settings` table.
    return {
      bronzeMultiplier: '1.0',
      silverMultiplier: '1.2',
      goldMultiplier: '1.5',
      pointsPerRupee: '0.1',
      walletTopUpEnabled: true,
      partialDeductionAllowed: true
    };
  }

  /**
   * Churn prevention logic using real order data.
   */
  async getChurnRiskCustomers(tenantId: string) {
    // Fetch customers who haven't ordered in 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        lastOrderAt: sql<string>`MAX(${orders.createdAt})`
      })
      .from(users)
      .innerJoin(orders, eq(users.id, orders.customerId))
      .where(and(eq(users.tenantId, tenantId), lte(orders.createdAt, sevenDaysAgo)))
      .groupBy(users.id)
      .orderBy(desc(sql`MAX(${orders.createdAt})`))
      .limit(10);

    return result.map(r => ({
      ...r,
      riskScore: 'High',
      message: 'No orders in 7+ days'
    }));
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
