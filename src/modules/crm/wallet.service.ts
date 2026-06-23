import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { customerProfiles, walletTransactions } from '../../db/schema/crm';

export class WalletService {
  /**
   * Add funds (Credit) to a customer's wallet
   */
  async creditWallet(tenantId: string, userId: string, amount: number, reason: string, orderId?: string) {
    return await db.transaction(async (tx) => {
      // 1. Insert Transaction Record
      const [transaction] = await tx.insert(walletTransactions).values({
        tenantId,
        userId,
        amount: amount.toString(),
        type: 'CREDIT',
        reason,
        orderId,
      }).returning();

      // 2. Update Customer Profile Wallet Balance
      await tx.update(customerProfiles)
        .set({
          walletBalance: sql`${customerProfiles.walletBalance} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customerProfiles.tenantId, tenantId),
            eq(customerProfiles.userId, userId)
          )
        );

      return transaction;
    });
  }

  /**
   * Deduct funds (Debit) from a customer's wallet
   */
  async debitWallet(tenantId: string, userId: string, amount: number, reason: string, orderId?: string) {
    return await db.transaction(async (tx) => {
      // Ensure sufficient balance
      const [profile] = await tx.select({ balance: customerProfiles.walletBalance })
        .from(customerProfiles)
        .where(
          and(
            eq(customerProfiles.tenantId, tenantId),
            eq(customerProfiles.userId, userId)
          )
        );

      if (!profile || parseFloat(profile.balance) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // 1. Insert Transaction Record
      const [transaction] = await tx.insert(walletTransactions).values({
        tenantId,
        userId,
        amount: amount.toString(),
        type: 'DEBIT',
        reason,
        orderId,
      }).returning();

      // 2. Update Customer Profile Wallet Balance
      await tx.update(customerProfiles)
        .set({
          walletBalance: sql`${customerProfiles.walletBalance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customerProfiles.tenantId, tenantId),
            eq(customerProfiles.userId, userId)
          )
        );

      return transaction;
    });
  }

  /**
   * Fetch wallet transaction history for a customer
   */
  async getWalletHistory(tenantId: string, userId: string) {
    return await db.select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.tenantId, tenantId),
          eq(walletTransactions.userId, userId)
        )
      )
      .orderBy(sql`${walletTransactions.createdAt} DESC`);
  }
}
