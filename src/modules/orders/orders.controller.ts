import { Elysia, t } from 'elysia';
import { OrdersService } from './orders.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { sanitizeLimit, buildCursorMeta } from '../../shared/pagination.ts';

const ordersService = new OrdersService();
import { db } from '../../db';
import { tenants } from '../../db/schema/tenants';
import { eq } from 'drizzle-orm';

export const ordersController = new Elysia({ prefix: '/v1/orders' })
  /**
   * POST /v1/orders/public/:slug
   * Public-facing endpoint for customers to place orders (e.g. from table QR code).
   * Does NOT require authentication.
   */
  .post('/public/:slug', async ({ params: { slug }, body }) => {
    // Look up tenantId by slug
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // placeOrder internally creates the KOT and emits EVENTS.NEW_KOT
    // which triggers the WebSocket broadcast in index.ts
    const result = await ordersService.placeOrder(tenant.id, {
      ...body,
      type: 'paid',
      customerId: undefined,
    });

    return {
      success: true,
      message: 'Order placed successfully',
      data: result,
    };
  }, {
    body: t.Object({
      branchId: t.String(),
      tableNumber: t.Optional(t.String()),
      note: t.Optional(t.String()),
      items: t.Array(
        t.Object({
          menuItemId: t.String(),
          quantity: t.Number({ minimum: 1 }),
        })
      ),
    })
  })

  // --- Auth Required Below Here ---
  .use(requireAuth)

  /**
   * POST /v1/orders
   * Place a new order securely.
   * Client sends an array of menu items; Server fetches true prices and executes transaction.
   */
  .post(
    '/',
    async ({ body, user }) => {
      // Pass the fully typed payload to the service. The service handles the ACID transaction.
      const result = await ordersService.placeOrder(user!.tenantId!, body);

      return {
        success: true,
        message: 'Order placed successfully',
        data: result,
      };
    },
    {
      body: t.Object({
        branchId: t.String(),
        customerId: t.Optional(t.String()),
        type: t.Union([
          t.Literal('paid'),
          t.Literal('subscription_redemption'),
          t.Literal('combo'),
        ]),
        tableNumber: t.Optional(t.String()),
        note: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            menuItemId: t.String(),
            quantity: t.Number({ minimum: 1 }),
          })
        ),
      }),
    }
  )

  /**
   * GET /v1/orders
   * Retrieves order history utilizing high-performance cursor pagination.
   */
  .get(
    '/',
    async ({ query, user }) => {
      const safeLimit = sanitizeLimit(query.limit);

      const items = await ordersService.getOrderHistory(
        user!.tenantId!,
        query.branchId,
        safeLimit,
        query.cursor
      );

      const result = buildCursorMeta(items, safeLimit, 'createdAt');

      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    },
    {
      query: t.Object({
        branchId: t.String(),
        limit: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
      }),
    }
  );
