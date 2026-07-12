import { Elysia, t } from 'elysia';
import { AnalyticsService } from './analytics.service.ts';
import { authPlugin } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const analyticsService = new AnalyticsService();

export const analyticsController = new Elysia({ prefix: '/v1/analytics' })
  .use(authPlugin)
  .use(requirePermission('analytics:read')) // Only authorized users can view analytics

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

  .get('/ai-forecast', async ({ user, query, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const data = await analyticsService.getSalesForecast(user.tenantId, query.branchId);
    return { success: true, data };
  }, {
    query: t.Object({
      branchId: t.String()
    })
  })

  .get('/ai-combos', async ({ user, query, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const data = await analyticsService.getSuggestedCombos(user.tenantId, query.branchId);
    return { success: true, data };
  }, {
    query: t.Object({
      branchId: t.String()
    })
  })

  /**
   * GET /v1/analytics/weekly-revenue
   * Returns daily revenue totals for the last N days (default 30).
   * Used to render the revenue trend area chart.
   */
  .get('/weekly-revenue', async ({ user, query, set }) => {
    if (!user?.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(query.branchId)) {
      return { success: true, data: [] };
    }

    const data = await analyticsService.getWeeklyRevenue(
      user.tenantId,
      query.branchId,
      query.days ? parseInt(query.days, 10) : 30
    );
    return { success: true, data };
  }, {
    query: t.Object({
      branchId: t.String(),
      days: t.Optional(t.String()),
    })
  })

  /**
   * GET /v1/analytics/hourly-sales
   * Returns revenue bucketed by hour of day — used for peak-hour heatmap chart.
   */
  .get('/hourly-sales', async ({ user, query, set }) => {
    if (!user?.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(query.branchId)) {
      return { success: true, data: [] };
    }

    const data = await analyticsService.getHourlySales(
      user.tenantId,
      query.branchId,
      query.days ? parseInt(query.days, 10) : 7
    );
    return { success: true, data };
  }, {
    query: t.Object({
      branchId: t.String(),
      days: t.Optional(t.String()),
    })
  });

