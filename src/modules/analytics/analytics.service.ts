import { sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';

export class AnalyticsService {
  /**
   * Calculates total sales, order count, and average order value for a specific branch on a given date.
   * Uses raw SQL for high-performance aggregation.
   * Note: Drizzle's `sql` template securely handles parameterization to prevent SQL injection.
   */
  async getDailySales(tenantId: string, branchId: string, date: string) {
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

    const rows = (result as any).rows || result;
    const row = rows[0] as any;
    return {
      totalOrders: parseInt(row?.total_orders || '0', 10),
      totalSales: parseFloat(row?.total_sales || '0'),
      averageOrderValue: parseFloat(row?.average_order_value || '0'),
    };
  }

  /**
   * Returns daily revenue totals for the last N days — used for revenue trend charts.
   */
  async getWeeklyRevenue(tenantId: string, branchId: string, days: number = 30) {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        TO_CHAR(DATE(created_at), 'DD Mon') as label,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE 
        tenant_id = ${tenantId}
        AND branch_id = ${branchId}
        AND status = 'delivered'
        AND created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    const rows = (result as any).rows || result;
    return rows.map((row: any) => ({
      date: row.date,
      label: row.label,
      revenue: parseFloat(row.revenue || '0'),
      orders: parseInt(row.orders || '0', 10),
    }));
  }

  /**
   * Returns revenue bucketed by hour of day — used for peak-hour heatmap.
   */
  async getHourlySales(tenantId: string, branchId: string, days: number = 7) {
    const result = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE 
        tenant_id = ${tenantId}
        AND branch_id = ${branchId}
        AND status = 'delivered'
        AND created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY hour
      ORDER BY hour ASC
    `);

    const rows = (result as any).rows || result;
    // Fill all 24 hours so the chart always has a complete dataset
    return Array.from({ length: 24 }, (_, h) => {
      const match = rows.find((r: any) => parseInt(r.hour) === h);
      return {
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        revenue: match ? parseFloat(match.revenue || '0') : 0,
        orders: match ? parseInt(match.orders || '0', 10) : 0,
      };
    });
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
   * Production: replace with a Facebook Prophet or ARIMA time-series model.
   */
  async getSalesForecast(tenantId: string, branchId: string) {
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
        forecast: (actual || 200) * (1 + (Math.random() * 0.1))
      };
    });
  }

  /**
   * AI Combo Suggestions based on items frequently bought together.
   * Production: use Apriori or FP-Growth algorithm.
   */
  async getSuggestedCombos(tenantId: string, _branchId: string) {
    return [
      { id: 'suggested1', name: 'Burger + Fries + Cola Combo', items: ['Cheese Burger', 'French Fries', 'Coca Cola'], recommendedPrice: 249, confidence: '94%', lift: '+15% sales' },
      { id: 'suggested2', name: 'Taco Meal Combo', items: ['Veg Quesadilla', 'Peri Peri Fries', 'Lemonade'], recommendedPrice: 199, confidence: '88%', lift: '+12% sales' }
    ];
  }
  /**
   * Retrieves staff performance metrics: total orders processed and revenue generated.
   */
  async getStaffPerformance(tenantId: string, branchId: string, days: number = 30) {
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(o.id) as orders_processed,
        COALESCE(SUM(o.total), 0) as revenue_generated
      FROM users u
      JOIN orders o ON o.staff_id = u.id
      WHERE 
        o.tenant_id = ${tenantId}
        AND o.branch_id = ${branchId}
        AND o.status = 'delivered'
        AND o.created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY u.id
      ORDER BY revenue_generated DESC
    `);

    const rows = (result as any).rows || result;
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      ordersProcessed: parseInt(row.orders_processed || '0', 10),
      revenueGenerated: parseFloat(row.revenue_generated || '0'),
    }));
  }

  /**
   * Generates an inventory forecast based on recent stock ledger changes.
   */
  async getInventoryForecast(tenantId: string, branchId: string) {
    const result = await db.execute(sql`
      WITH CurrentStock AS (
        SELECT 
          raw_material_id, 
          SUM(quantity_change) as stock_level
        FROM stock_ledgers
        WHERE tenant_id = ${tenantId} AND branch_id = ${branchId}
        GROUP BY raw_material_id
      ),
      DailyConsumption AS (
        SELECT 
          raw_material_id, 
          ABS(SUM(quantity_change)) / 30 as avg_daily_usage
        FROM stock_ledgers
        WHERE 
          tenant_id = ${tenantId} 
          AND branch_id = ${branchId}
          AND quantity_change < 0
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY raw_material_id
      )
      SELECT 
        rm.id,
        rm.name,
        rm.uom,
        COALESCE(cs.stock_level, 0) as current_stock,
        COALESCE(dc.avg_daily_usage, 0) as avg_daily_usage,
        CASE 
          WHEN COALESCE(dc.avg_daily_usage, 0) = 0 THEN 999
          ELSE COALESCE(cs.stock_level, 0) / dc.avg_daily_usage 
        END as days_remaining
      FROM raw_materials rm
      LEFT JOIN CurrentStock cs ON cs.raw_material_id = rm.id
      LEFT JOIN DailyConsumption dc ON dc.raw_material_id = rm.id
      WHERE rm.tenant_id = ${tenantId}
      ORDER BY days_remaining ASC
    `);

    const rows = (result as any).rows || result;
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      uom: row.uom,
      currentStock: parseFloat(row.current_stock || '0'),
      avgDailyUsage: parseFloat(row.avg_daily_usage || '0'),
      daysRemaining: parseFloat(row.days_remaining || '0'),
    }));
  }
}
