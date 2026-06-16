import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';
import { AdsService } from './ads.service';

const adsService = new AdsService();

export const adsController = new Elysia({ prefix: '/v1/ads' })
  /**
   * GET /v1/ads
   * Public endpoint to fetch active ads for the customer app.
   */
  .get('/', async ({ query, headers }) => {
    // We can infer tenantId from host or use a header for now
    const tenantId = headers['x-tenant-id'] as string; 
    const data = await adsService.getActiveAds(tenantId, query.branchId);
    return { success: true, data };
  }, {
    query: t.Object({
      branchId: t.Optional(t.String())
    })
  })

  /**
   * POST /v1/ads/:id/click
   * Record a click on an advertisement.
   */
  .post('/:id/click', async ({ params: { id }, headers }) => {
    const userId = headers['x-user-id'] as string; // Optional user context
    await adsService.recordImpression(id, userId, true);
    return { success: true };
  })

  .use(authPlugin)
  .use(requireRoles(['admin', 'manager']))

  /**
   * POST /v1/ads
   * Create a new advertisement. Restricted to Admins.
   */
  .post('/', async ({ body, user }) => {
    const data = await adsService.createAd(user!.tenantId!, {
      ...body,
      activeFrom: body.activeFrom ? new Date(body.activeFrom) : undefined,
      activeUntil: body.activeUntil ? new Date(body.activeUntil) : undefined,
    });
    return { success: true, data };
  }, {
    body: t.Object({
      title: t.String(),
      imageUrl: t.String(),
      branchId: t.Optional(t.String()),
      link: t.Optional(t.String()),
      activeFrom: t.Optional(t.String()),
      activeUntil: t.Optional(t.String()),
    })
  });
