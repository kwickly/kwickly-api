import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../../db';
import { restaurantTables, tableSessions, kots, orders } from '../../db/schema';
import { tenants } from '../../db/schema/tenants';
import type { NewRestaurantTable } from '../../db/schema/restaurant_tables';
import crypto from 'crypto';

function generateQrToken() {
  return crypto.randomBytes(4).toString('hex'); // 8 char hex string
}

import { branches } from '../../db/schema/branches';

export class TablesService {
  private async verifyBranchOwnership(branchId: string, tenantId: string) {
    const branch = await db.query.branches.findFirst({
      where: and(eq(branches.id, branchId), eq(branches.tenantId, tenantId))
    });
    if (!branch) {
      throw new Error('Unauthorized or Branch not found');
    }
    return branch;
  }

  async getTables(branchId: string, tenantId: string) {
    await this.verifyBranchOwnership(branchId, tenantId);

    const tables = await db.query.restaurantTables.findMany({
      where: and(
        eq(restaurantTables.branchId, branchId),
        isNull(restaurantTables.deletedAt)
      ),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });

    const activeSessionIds = tables.map(t => t.currentSessionId).filter(id => id !== null) as string[];
    let activeSessions: any[] = [];
    if (activeSessionIds.length > 0) {
      activeSessions = await db.query.tableSessions.findMany({
        where: sql`${tableSessions.id} IN ${activeSessionIds}`,
        with: { order: true }
      });
    }

    const sessionMap = new Map(activeSessions.map(s => [s.id, s]));

    return tables.map(t => ({
      ...t,
      session: t.currentSessionId ? sessionMap.get(t.currentSessionId) : null
    }));
  }

  async createTable(tenantId: string, branchId: string, data: Omit<NewRestaurantTable, 'branchId' | 'qrToken'>) {
    await this.verifyBranchOwnership(branchId, tenantId);
    
    return await db.transaction(async (tx) => {
      const [tenant] = await tx.select({ maxTables: tenants.maxTables }).from(tenants).where(eq(tenants.id, tenantId));
      if (!tenant) throw new Error('Tenant not found');

      const result = await tx.select({ count: sql<number>`cast(count(${restaurantTables.id}) as int)` })
        .from(restaurantTables)
        .where(and(eq(restaurantTables.branchId, branchId), isNull(restaurantTables.deletedAt)));

      const count = result[0]?.count || 0;
      
      if (count >= tenant.maxTables) {
        throw new Error(`Your plan supports a maximum of ${tenant.maxTables} tables. Please upgrade to add more.`);
      }

      const qrToken = generateQrToken();
      const [newTable] = await tx.insert(restaurantTables).values({
        ...data,
        branchId,
        qrToken,
      }).returning();

      return newTable;
    });
  }

  async updateTable(id: string, branchId: string, tenantId: string, data: Partial<NewRestaurantTable>) {
    await this.verifyBranchOwnership(branchId, tenantId);
    const [updated] = await db.update(restaurantTables)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(restaurantTables.id, id), eq(restaurantTables.branchId, branchId)))
      .returning();
    if (!updated) throw new Error('Table not found');
    return updated;
  }

  async deleteTable(id: string, branchId: string, tenantId: string) {
    await this.verifyBranchOwnership(branchId, tenantId);
    const table = await db.query.restaurantTables.findFirst({
      where: and(eq(restaurantTables.id, id), eq(restaurantTables.branchId, branchId))
    });
    if (!table) throw new Error('Table not found');
    if (table.currentSessionId) {
      throw new Error('Cannot delete a table with an active session');
    }

    await db.update(restaurantTables)
      .set({ deletedAt: new Date(), status: 'available' })
      .where(eq(restaurantTables.id, id));
  }

  async regenerateQrToken(id: string, branchId: string, tenantId: string) {
    await this.verifyBranchOwnership(branchId, tenantId);
    const newToken = generateQrToken();
    const [updated] = await db.update(restaurantTables)
      .set({ qrToken: newToken, updatedAt: new Date() })
      .where(and(eq(restaurantTables.id, id), eq(restaurantTables.branchId, branchId)))
      .returning();
    if (!updated) throw new Error('Table not found');
    return updated;
  }

  async closeSession(sessionId: string, branchId: string, tenantId: string) {
    await this.verifyBranchOwnership(branchId, tenantId);
    return await db.transaction(async (tx) => {
      const session = await tx.query.tableSessions.findFirst({
        where: and(eq(tableSessions.id, sessionId), eq(tableSessions.branchId, branchId))
      });
      if (!session) throw new Error('Session not found');
      if (session.status === 'closed') throw new Error('Session is already closed');

      await tx.update(tableSessions)
        .set({ status: 'closed', endedAt: new Date() })
        .where(eq(tableSessions.id, sessionId));

      await tx.update(restaurantTables)
        .set({ currentSessionId: null, status: 'cleaning', updatedAt: new Date() })
        .where(eq(restaurantTables.id, session.tableId));

      return { success: true };
    });
  }
}

export const tablesService = new TablesService();
