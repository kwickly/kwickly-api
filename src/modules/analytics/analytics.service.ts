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

  /**
   * Mock AI forecasting based on last 7 days of real data.
   */
  async getSalesForecast(tenantId: string, branchId: string) {
    // In a production app, this would use a time-series model.
    // Here we fetch actuals for last 5 days and add a mock 2-day forecast.
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'Dy') as day,
        SUM(total) as actual
      FROM orders
      WHERE 
        tenant_id = ${tenantId}
        AND branch_id = ${branchId}
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day, DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    const rows = (result as any).rows || result;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map(day => {
      const match = rows.find((r: any) => r.day.trim() === day);
      const actual = match ? parseFloat(match.actual) : null;
      return {
        date: day,
        actual: actual,
        forecast: (actual || 200) * (1 + (Math.random() * 0.1)) // Mock 10% variance forecast
      };
    });
  }

  /**
   * AI Combo Suggestions based on items frequently bought together.
   */
  async getSuggestedCombos(tenantId: string, branchId: string) {
    // Simple "Frequent Itemset" mock query.
    // In production, use Apriori or FP-Growth algorithm.
    return [
      { id: 'suggested1', name: 'Burger + Fries + Cola Combo', items: ['Cheese Burger', 'French Fries', 'Coca Cola'], recommendedPrice: '249', confidence: '94%', lift: '+15% sales' },
      { id: 'suggested2', name: 'Taco Meal Combo', items: ['Veg Quesadilla', 'Peri Peri Fries', 'Lemonade'], recommendedPrice: '199', confidence: '88%', lift: '+12% sales' }
    ];
  }
}
