import { eq, and, sql, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { subscriptionPlans, customerSubscriptions } from '../../db/schema/subscriptions';
import type { NewSubscriptionPlan } from '../../db/schema/subscriptions';
import { attendanceLogs } from '../../db/schema/attendance';

export class SubscriptionsService {
  /**
   * Fetch subscription plans for a tenant/branch.
   */
  async getPlans(tenantId: string, branchId?: string, includeInactive: boolean = false) {
    const conditions = [
      eq(subscriptionPlans.tenantId, tenantId),
      isNull(subscriptionPlans.deletedAt),
    ];
    if (!includeInactive) {
      conditions.push(eq(subscriptionPlans.isActive, true));
    }
    if (branchId) {
      conditions.push(eq(subscriptionPlans.branchId, branchId));
    }

    return await db
      .select()
      .from(subscriptionPlans)
      .where(and(...conditions))
      .execute();
  }

  /**
   * Update an existing subscription plan
   */
  async updatePlan(tenantId: string, planId: string, data: Partial<Omit<NewSubscriptionPlan, 'tenantId'>>) {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.tenantId, tenantId)))
      .returning();

    return plan;
  }

  /**
   * Soft delete a subscription plan
   */
  async deletePlan(tenantId: string, planId: string) {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.tenantId, tenantId)))
      .returning();

    return plan;
  }

  /**
   * Mock purchase a plan (would be via webhook in real life).
   */
  async purchasePlan(tenantId: string, customerId: string, planId: string) {
    // 1. Fetch Plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.tenantId, tenantId)))
      .execute();

    if (!plan) throw new Error('Subscription plan not found or inactive.');

    // 2. Generate random secret for this customer's subscription
    const qrSecret = crypto.randomBytes(32).toString('hex');

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.validityDays);

    // 3. Create customer subscription
    const [newSub] = await db
      .insert(customerSubscriptions)
      .values({
        tenantId,
        customerId,
        planId,
        status: 'active',
        totalMeals: plan.totalMeals,
        balanceRemaining: plan.totalMeals,
        startsAt,
        expiresAt,
        qrSecret,
      })
      .returning();

    return newSub;
  }

  /**
   * Generates a signed QR payload for the customer.
   * Payload: Base64( JSON.stringify({ subId, timestamp, sig }) )
   */
  async generateQR(tenantId: string, customerId: string) {
    // Fetch active subscription
    const [sub] = await db
      .select()
      .from(customerSubscriptions)
      .where(
        and(
          eq(customerSubscriptions.tenantId, tenantId),
          eq(customerSubscriptions.customerId, customerId),
          eq(customerSubscriptions.status, 'active')
        )
      )
      .execute();

    if (!sub) throw new Error('No active subscription found.');
    if (sub.balanceRemaining <= 0) throw new Error('Subscription balance is exhausted.');
    if (new Date() > sub.expiresAt) throw new Error('Subscription has expired.');

    const timestamp = Date.now();
    const dataString = `${sub.id}:${timestamp}`;
    
    // Sign it using the customer's unique qrSecret
    const sig = crypto.createHmac('sha256', sub.qrSecret).update(dataString).digest('hex');

    const payload = {
      subId: sub.id,
      timestamp,
      sig,
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validates a QR code and deducts a meal.
   * Executed by the Staff QR Scanner app.
   */
  async scanQR(tenantId: string, branchId: string, staffId: string, qrBase64: string) {
    let payload;
    try {
      const decoded = Buffer.from(qrBase64, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (err) {
      throw new Error('Invalid QR format.');
    }

    const { subId, timestamp, sig } = payload;
    if (!subId || !timestamp || !sig) throw new Error('Malformed QR code.');

    // 1. Time-based replay prevention (Reject if > 30 seconds old)
    const ageSeconds = (Date.now() - timestamp) / 1000;
    if (ageSeconds > 30) {
      throw new Error('QR code expired. Please ask the customer to refresh their screen.');
    }

    // 2. Fetch the subscription
    const [sub] = await db
      .select()
      .from(customerSubscriptions)
      .where(and(eq(customerSubscriptions.id, subId), eq(customerSubscriptions.tenantId, tenantId)))
      .execute();

    if (!sub) throw new Error('Subscription not found.');
    if (sub.status !== 'active') throw new Error(`Subscription is ${sub.status}.`);
    if (sub.balanceRemaining <= 0) throw new Error('Insufficient meals remaining.');
    if (new Date() > sub.expiresAt) throw new Error('Subscription has expired.');

    // 3. Verify Signature
    const dataString = `${sub.id}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', sub.qrSecret).update(dataString).digest('hex');
    
    if (sig !== expectedSig) {
      throw new Error('QR signature mismatch. Possible tampering.');
    }

    // 4. ACID Transaction: Deduct balance and log attendance
    return await db.transaction(async (tx) => {
      // Deduct balance
      const [updatedSub] = await tx
        .update(customerSubscriptions)
        .set({
          balanceRemaining: sql`${customerSubscriptions.balanceRemaining} - 1`,
          status: sub.balanceRemaining - 1 === 0 ? 'exhausted' : 'active',
          updatedAt: new Date(),
        })
        .where(eq(customerSubscriptions.id, sub.id))
        .returning();

      const [log] = await tx
        .insert(attendanceLogs)
        .values({
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          branchId,
          staffId,
          mealType: 'lunch', // Ideally determined by current time
          scannedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: 'Scan successful!',
        remaining: updatedSub ? updatedSub.balanceRemaining : sub.balanceRemaining - 1,
        log,
      };
    });
  }

  /**
   * Create a new subscription plan (Admin)
   */
  async createPlan(tenantId: string, data: Omit<NewSubscriptionPlan, 'tenantId'>) {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values({
        ...data,
        tenantId,
      })
      .returning();

    return plan;
  }
  /**
   * Fetch all customer subscriptions for a tenant (Dashboard View)
   */
  async getCustomerSubscriptions(tenantId: string) {
    return await db
      .select({
        id: customerSubscriptions.id,
        status: customerSubscriptions.status,
        totalMeals: customerSubscriptions.totalMeals,
        balanceRemaining: customerSubscriptions.balanceRemaining,
        startsAt: customerSubscriptions.startsAt,
        expiresAt: customerSubscriptions.expiresAt,
        autoRenew: customerSubscriptions.autoRenew,
        createdAt: customerSubscriptions.createdAt,
        customer: {
          id: require('../../db/schema/users').users.id,
          name: require('../../db/schema/users').users.name,
          email: require('../../db/schema/users').users.email,
        },
        plan: {
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          mealType: subscriptionPlans.mealType,
        }
      })
      .from(customerSubscriptions)
      .innerJoin(require('../../db/schema/users').users, eq(customerSubscriptions.customerId, require('../../db/schema/users').users.id))
      .innerJoin(subscriptionPlans, eq(customerSubscriptions.planId, subscriptionPlans.id))
      .where(eq(customerSubscriptions.tenantId, tenantId))
      .orderBy(customerSubscriptions.createdAt)
      .execute();
  }

  /**
   * Update customer subscription status (Pause / Activate / Cancel)
   */
  async updateCustomerSubscriptionStatus(tenantId: string, subscriptionId: string, status: 'active' | 'paused' | 'cancelled') {
    const [sub] = await db
      .update(customerSubscriptions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(customerSubscriptions.id, subscriptionId), eq(customerSubscriptions.tenantId, tenantId)))
      .returning();
    
    return sub;
  }
}
