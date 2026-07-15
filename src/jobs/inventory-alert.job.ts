import { schedules } from '@trigger.dev/sdk/v3';
import { db } from '../db/index.ts';
import { sql } from 'drizzle-orm';
import { tenants } from '../db/schema/tenants.ts';
import { AnalyticsService } from '../modules/analytics/analytics.service.ts';
import { NotificationService } from '../modules/notifications/notifications.service.ts';

const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();

export const inventoryAlertsJob = schedules.task({
  id: 'inventory-alerts-job',
  cron: '0 2 * * *', // Run every night at 2 AM
  run: async () => {
    // 1. Get all active tenants
    const activeTenants = await db.select({ id: tenants.id }).from(tenants);

    for (const tenant of activeTenants) {
      // 2. Fetch managers/owners for the tenant
      const managers = await db.execute(sql`
        SELECT id FROM users WHERE tenant_id = ${tenant.id} AND role IN ('tenant_owner', 'manager')
      `);
      
      const managerRows = (managers as any).rows || managers;

      // 3. For each branch
      const branches = await db.execute(sql`SELECT id FROM branches WHERE tenant_id = ${tenant.id}`);
      const branchRows = (branches as any).rows || branches;

      for (const branch of branchRows) {
        // 4. Get inventory forecast
        const forecast = await analyticsService.getInventoryForecast(tenant.id, branch.id);
        
        // 5. Filter items running out in < 3 days
        const criticalItems = forecast.filter((item: any) => item.daysRemaining < 3 && item.daysRemaining >= 0);

        if (criticalItems.length > 0) {
          const itemNames = criticalItems.map((item: any) => `${item.name} (${item.daysRemaining.toFixed(1)} days left)`).join(', ');

          for (const manager of managerRows) {
            try {
              await notificationService.sendFromTemplate(tenant.id, manager.id, 'low_stock_alert', {
                items: itemNames,
                branchId: branch.id
              });
            } catch (error) {
              console.error(`Failed to send alert for tenant ${tenant.id}:`, error);
            }
          }
        }
      }
    }
  },
});
