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
  );
