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
    async ({ query, user }) => {
      const data = await analyticsService.getDailySales(
        user!.tenantId!,
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
    async ({ query, user }) => {
      const data = await analyticsService.getTopSellingItems(
        user!.tenantId!,
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
  );
