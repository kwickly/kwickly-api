import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { tenants, tenantBillingMeters, users, devices } from '../../db/schema/index.ts';

export interface PlanLimits {
  includedStaff: number;
  includedDevices: number;
  includedOrders: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  BASIC: { includedStaff: 3, includedDevices: 1, includedOrders: 100 },
  STARTER: { includedStaff: 5, includedDevices: 2, includedOrders: 500 },
  GROWTH: { includedStaff: 15, includedDevices: 5, includedOrders: 2000 },
  ENTERPRISE: { includedStaff: Infinity, includedDevices: Infinity, includedOrders: Infinity },
};

export class BillingService {
  /**
   * Get or create the active billing meter for the current month
   */
  async getOrCreateActiveMeter(tenantId: string): Promise<any> {
    const now = new Date();
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Look for an existing meter for this period
    const [existingMeter] = await db
      .select()
      .from(tenantBillingMeters)
      .where(
        and(
          eq(tenantBillingMeters.tenantId, tenantId),
          eq(tenantBillingMeters.billingPeriodStart, billingPeriodStart),
          isNull(tenantBillingMeters.deletedAt)
        )
      )
      .limit(1);

    if (existingMeter) {
      return existingMeter;
    }

    // Retrieve active staff count
    const [staffCountRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'customer'`,
          eq(users.status, 'ACTIVE'),
          isNull(users.deletedAt)
        )
      );
    const activeStaffCount = Number(staffCountRes?.count || 0);

    // Retrieve active device count
    const [deviceCountRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devices)
      .where(
        and(
          eq(devices.tenantId, tenantId),
          eq(devices.status, 'active'),
          isNull(devices.deletedAt)
        )
      );
    const activeDeviceCount = Number(deviceCountRes?.count || 0);

    // Create a new billing meter record
    const [newMeter] = await db
      .insert(tenantBillingMeters)
      .values({
        tenantId,
        billingPeriodStart,
        billingPeriodEnd,
        orderCount: 0,
        smsCount: 0,
        activeStaffCount,
        activeDeviceCount,
        amountDue: '0.00',
        status: 'PENDING',
      })
      .returning();

    return newMeter;
  }

  /**
   * Increment the order count in the active billing meter
   */
  async incrementOrderCount(tenantId: string): Promise<void> {
    const meter = await this.getOrCreateActiveMeter(tenantId);
    await db
      .update(tenantBillingMeters)
      .set({
        orderCount: meter.orderCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tenantBillingMeters.id, meter.id));
  }

  /**
   * Increment the SMS count in the active billing meter
   */
  async incrementSmsCount(tenantId: string): Promise<void> {
    const meter = await this.getOrCreateActiveMeter(tenantId);
    await db
      .update(tenantBillingMeters)
      .set({
        smsCount: meter.smsCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tenantBillingMeters.id, meter.id));
  }

  /**
   * Calculate the monthly amount due for a billing period
   */
  async calculateMonthlyDue(tenantId: string): Promise<any> {
    const meter = await this.getOrCreateActiveMeter(tenantId);
    
    // Fetch tenant configuration
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) throw new Error('Tenant not found');

    const plan = tenant.plan;
    const limits = PLAN_LIMITS[plan] || { includedStaff: 0, includedDevices: 0, includedOrders: 0 };
    
    // 1. Calculate Base Fee
    let baseAmount = parseFloat(tenant.baseFee);
    
    // Minimum Active Tenant Fee override for PAYG/Metered models if baseFee is set to 0.
    if (tenant.billingModel === 'METERED' && baseAmount === 0) {
      baseAmount = 299.00;
    }

    // 2. Calculate Order Transaction Fees
    let orderFee = 0;
    const orders = meter.orderCount;
    
    if (tenant.billingModel === 'METERED') {
      if (tenant.customOrderRate) {
        orderFee = orders * parseFloat(tenant.customOrderRate);
      } else {
        // Metered progressive volume tiers:
        // 0 - 1500: ₹4.00 per order
        // 1501 - 3000: ₹3.00 per order
        // 3001 - 10000: ₹2.00 per order
        // > 10000: ₹1.50 per order
        if (orders <= 1500) {
          orderFee = orders * 4.00;
        } else if (orders <= 3000) {
          orderFee = (1500 * 4.00) + ((orders - 1500) * 3.00);
        } else if (orders <= 10000) {
          orderFee = (1500 * 4.00) + (1500 * 3.00) + ((orders - 3000) * 2.00);
        } else {
          orderFee = (1500 * 4.00) + (1500 * 3.00) + (7000 * 2.00) + ((orders - 10000) * 1.50);
        }
      }
    } else {
      // FLAT rate has included orders. Extra orders are charged flat at ₹2.50 per order.
      if (orders > limits.includedOrders) {
        orderFee = (orders - limits.includedOrders) * 2.50;
      }
    }

    // 3. Calculate Extra Staff Fees
    let staffFee = 0;
    if (meter.activeStaffCount > limits.includedStaff) {
      staffFee = (meter.activeStaffCount - limits.includedStaff) * 100.00;
    }

    // 4. Calculate Extra Device Fees
    let deviceFee = 0;
    if (meter.activeDeviceCount > limits.includedDevices) {
      deviceFee = (meter.activeDeviceCount - limits.includedDevices) * 499.00;
    }

    // 5. Calculate Extra SMS Fees (beyond 200 free messages)
    let smsFee = 0;
    if (meter.smsCount > 200) {
      smsFee = (meter.smsCount - 200) * 1.50;
    }

    const totalDue = baseAmount + orderFee + staffFee + deviceFee + smsFee;

    // Update the record with calculated amount
    const [updatedMeter] = await db
      .update(tenantBillingMeters)
      .set({
        amountDue: totalDue.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(tenantBillingMeters.id, meter.id))
      .returning();

    return {
      meter: updatedMeter,
      breakdown: {
        baseFee: baseAmount,
        orderFee,
        staffFee,
        deviceFee,
        smsFee,
        total: totalDue,
      }
    };
  }
}
