import { Elysia, t } from 'elysia';
import { KOTsService } from './kots.service.ts';
import { authPlugin } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const kotsService = new KOTsService();

export const kotsController = new Elysia({ prefix: '/v1/kots' })
  .use(authPlugin)
  .use(requirePermission('orders:write'))

  /**
   * PATCH /v1/kots/:id/status
   * Kitchen staff taps a ticket on the KDS to update its status.
   */
  .patch(
    '/:id/status',
    async ({ params: { id }, body, user }) => {
      const data = await kotsService.updateKOTStatus(user!.tenantId!, id, body.status);
      return { success: true, data, message: 'KOT status updated' };
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal('pending'),
          t.Literal('preparing'),
          t.Literal('ready'),
          t.Literal('completed'),
        ]),
      }),
    }
  );
