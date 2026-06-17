import { Elysia, t } from 'elysia';
import { AnalyticsService } from './analytics.service.ts';
import { authPlugin } from '../auth/auth.guard.ts';
import { requireRoles } from '../auth/rbac.guard.ts';

const analyticsService = new AnalyticsService();

export const analyticsController = new Elysia({ prefix: '/v1/analytics' })
  .use(authPlugin)
  .use(requireRoles(['admin', 'manager'])) // Only managers/admins can view analytics

  /**
   * GET /v1/analytics/sales
   * Fetches daily sales summary for a branch.
   */
  .get(
    '/sales',
    async ({ query, user, set }) => {
      if (!user?.tenantId) {
        set.status = 403;
        return { success: false, error: 'Tenant context required' };
      }

      // Check if branchId is a valid UUID, otherwise return empty stats
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(query.branchId)) {
        return { success: true, data: { totalOrders: 0, totalSales: 0, averageOrderValue: 0 } };
      }

      const data = await analyticsService.getDailySales(
        user.tenantId,
        query.branchId,
        query.date
      );

      return {
        success: true,
        data,
      };
    },
    {
      query: t.Object({
        branchId: t.String(),
        date: t.String({ format: 'date', default: new Date().toISOString().split('T')[0] }),
      }),
    }
  )

  /**
   * GET /v1/analytics/top-items
   * Fetches the top-selling items.
   */
  .get(
    '/top-items',
    async ({ query, user, set }) => {
      if (!user?.tenantId) {
        set.status = 403;
        return { success: false, error: 'Tenant context required' };
      }

      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(query.branchId)) {
        return { success: true, data: [] };
      }

      const data = await analyticsService.getTopSellingItems(
        user.tenantId,
        query.branchId,
        query.limit ? parseInt(query.limit, 10) : 5
      );

      return {
        success: true,
        data,
      };
    },
    {
      query: t.Object({
        branchId: t.String(),
        limit: t.Optional(t.String()), // Query params are strings by default
      }),
    }
  )

  .get('/ai-forecast', async () => {
    return {
      success: true,
      data: [
        { date: 'Mon', actual: 120, forecast: 125 },
        { date: 'Tue', actual: 180, forecast: 175 },
        { date: 'Wed', actual: 140, forecast: 145 },
        { date: 'Thu', actual: 220, forecast: 210 },
        { date: 'Fri', actual: 310, forecast: 320 },
        { date: 'Sat', actual: null, forecast: 430 },
        { date: 'Sun', actual: null, forecast: 390 }
      ]
    };
  })

  .get('/ai-combos', async () => {
    return {
      success: true,
      data: [
        { id: 'suggested1', name: 'Burger + Fries + Cola Combo', items: ['Cheese Burger', 'French Fries', 'Coca Cola'], recommendedPrice: '249', confidence: '94%', lift: '+15% sales' },
        { id: 'suggested2', name: 'Taco Meal Combo', items: ['Veg Quesadilla', 'Peri Peri Fries', 'Lemonade'], recommendedPrice: '199', confidence: '88%', lift: '+12% sales' }
      ]
    };
  });
