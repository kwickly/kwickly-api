export declare class AnalyticsService {
    /**
     * Calculates total sales, order count, and average order value for a specific branch on a given date.
     * Uses raw SQL for high-performance aggregation.
     * Note: Drizzle's `sql` template securely handles parameterization to prevent SQL injection.
     */
    getDailySales(tenantId: string, branchId: string, date: string): Promise<{
        totalOrders: number;
        totalSales: number;
        averageOrderValue: number;
    }>;
    /**
     * Returns daily revenue totals for the last N days — used for revenue trend charts.
     */
    getWeeklyRevenue(tenantId: string, branchId: string, days?: number): Promise<any>;
    /**
     * Returns revenue bucketed by hour of day — used for peak-hour heatmap.
     */
    getHourlySales(tenantId: string, branchId: string, days?: number): Promise<{
        hour: number;
        label: string;
        revenue: number;
        orders: number;
    }[]>;
    /**
     * Retrieves the top N best-selling items for a branch.
     */
    getTopSellingItems(tenantId: string, branchId: string, limit?: number): Promise<any>;
    /**
     * Mock AI forecasting based on last 7 days of real data.
     * Production: replace with a Facebook Prophet or ARIMA time-series model.
     */
    getSalesForecast(tenantId: string, branchId: string): Promise<{
        date: string;
        actual: number | null;
        forecast: number;
    }[]>;
    /**
     * AI Combo Suggestions based on items frequently bought together.
     * Production: use Apriori or FP-Growth algorithm.
     */
    getSuggestedCombos(tenantId: string, _branchId: string): Promise<{
        id: string;
        name: string;
        items: string[];
        recommendedPrice: number;
        confidence: string;
        lift: string;
    }[]>;
}
