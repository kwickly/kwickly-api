import { Elysia, t } from 'elysia';
import { OrdersService } from './orders.service.ts';
import { authPlugin } from '../auth/auth.guard.ts';

const ordersService = new OrdersService();

export const ordersController = new Elysia({ prefix: '/v1/orders' })
  .use(authPlugin)

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
   * Retrieves order history for the past 6 months (MVP standard).
   */
  .get(
    '/',
    async ({ query, user }) => {
      const data = await ordersService.getOrderHistory(
        user!.tenantId!,
        query.branchId,
        query.limit ? parseInt(query.limit, 10) : 50,
        query.offset ? parseInt(query.offset, 10) : 0
      );

      return {
        success: true,
        data,
      };
    },
    {
      query: t.Object({
        branchId: t.String(),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  );
