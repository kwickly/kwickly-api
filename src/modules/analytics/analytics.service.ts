import { sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';

export class AnalyticsService {
  /**
   * Calculates total sales, order count, and average order value for a specific branch on a given date.
   * Uses raw SQL for high-performance aggregation.
   */
  async getDailySales(tenantId: string, branchId: string, date: string) {
    // Note: Drizzle's `sql` template securely handles parameterization to prevent SQL injection.
    const result = await db.execute(sql`
      SELECT 
        COUNT(id) as total_orders,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(AVG(total), 0) as average_order_value
      FROM orders
      WHERE 
        tenant_id = ${tenantId} 
        AND branch_id = ${branchId}
        AND status = 'delivered'
        AND DATE(created_at) = DATE(${date})
    `);

    // Postgres returns aggregates as strings, so we parse them
    const rows = (result as any).rows || result;
    const row = rows[0] as any;
    return {
      totalOrders: parseInt(row?.total_orders || '0', 10),
      totalSales: parseFloat(row?.total_sales || '0'),
      averageOrderValue: parseFloat(row?.average_order_value || '0'),
    };
  }

  /**
   * Retrieves the top N best-selling items for a branch.
   */
  async getTopSellingItems(tenantId: string, branchId: string, limit: number = 5) {
    const result = await db.execute(sql`
      SELECT 
        oi.name, 
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE 
        o.tenant_id = ${tenantId}
        AND o.branch_id = ${branchId}
        AND o.status = 'delivered'
      GROUP BY oi.name
      ORDER BY total_quantity_sold DESC
      LIMIT ${limit}
    `);

    const rows = (result as any).rows || result;
    return rows.map((row: any) => ({
      name: row.name,
      quantitySold: parseInt(row.total_quantity_sold || '0', 10),
      revenue: parseFloat(row.total_revenue || '0'),
    }));
  }
}
