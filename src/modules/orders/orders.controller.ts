import { Elysia, t } from 'elysia';
import { OrdersService } from './orders.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { sanitizeLimit, buildCursorMeta } from '../../shared/pagination.ts';
import { BillingService } from '../billing/billing.service.ts';
import { Stream } from '@elysiajs/stream';
import { eventBus, EVENTS } from '../../shared/events.ts';

const ordersService = new OrdersService();
const billingService = new BillingService();
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

    let realBranchId = body.branchId;
    if (realBranchId === 'default') {
      const { branches } = await import('../../db/schema/branches');
      const [branch] = await db.select({ id: branches.id }).from(branches).where(eq(branches.tenantId, tenant.id)).limit(1);
      if (branch) {
        realBranchId = branch.id;
      } else {
        return { success: false, error: 'Branch not found' };
      }
    }

    // placeOrder internally creates the KOT and emits EVENTS.NEW_KOT
    // which triggers the WebSocket broadcast in index.ts
    let result;
    try {
      result = await ordersService.placeOrder(tenant.id, {
        ...body,
        branchId: realBranchId,
        type: 'paid',
        customerId: undefined,
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to place order' };
    }

    // Increment monthly billing order count
    try {
      await billingService.incrementOrderCount(tenant.id);
    } catch (err) {
      console.error('Failed to increment order billing meter:', err);
    }

    return {
      success: true,
      message: 'Order placed successfully',
      data: {
        ...result,
        sessionId: result.order.sessionId // Pass sessionId to client for adding items later
      },
    };
  }, {
    body: t.Object({
      branchId: t.String(),
      tableNumber: t.Optional(t.String()),
      qrToken: t.Optional(t.String()),
      note: t.Optional(t.String()),
      items: t.Array(
        t.Object({
          menuItemId: t.String(),
          quantity: t.Number({ minimum: 1 }),
          fulfillmentMode: t.Optional(t.Union([
            t.Literal('dine_in'),
            t.Literal('takeaway'),
            t.Literal('delivery')
          ])),
        })
      ),
    })
  })

  /**
   * POST /v1/orders/public/:slug/sessions/:sessionId/add-items
   * Public-facing endpoint for customers to add items to their active dine-in session.
   */
  .post('/public/:slug/sessions/:sessionId/add-items', async ({ params: { slug, sessionId }, body }) => {
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) return { success: false, error: 'Restaurant not found' };

    let result;
    try {
      result = await ordersService.addItemsToSession(tenant.id, sessionId, body);
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add items' };
    }

    return {
      success: true,
      data: {
        ...result,
        sessionId
      }
    };
  }, {
    body: t.Object({
      items: t.Array(
        t.Object({
          menuItemId: t.String(),
          quantity: t.Number(),
          fulfillmentMode: t.Optional(t.Union([
            t.Literal('dine_in'),
            t.Literal('takeaway'),
            t.Literal('delivery')
          ])),
        })
      )
    })
  })

  /**
   * GET /v1/orders/public/:slug/session?t=QR_TOKEN
   * Fetches active session info for a given table QR code.
   * Helps frontend know if a tab is already open (render previous items)
   * or if they are starting fresh.
   */
  .get('/public/:slug/session', async ({ params: { slug }, query }) => {
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) return { success: false, error: 'Restaurant not found' };

    if (!query.t) return { success: false, error: 'QR Token required' };

    const { restaurantTables, tableSessions } = await import('../../db/schema/index.ts');
    
    // Find table
    const [table] = await db.select().from(restaurantTables).where(eq(restaurantTables.qrToken, query.t));
    if (!table) return { success: false, error: 'Invalid QR Token' };

    if (!table.currentSessionId) {
      return { success: true, activeSession: null, table: { id: table.id, name: table.name } };
    }

    // Fetch session + order + items
    const session = await db.query.tableSessions.findFirst({
      where: eq(tableSessions.id, table.currentSessionId),
      with: {
        order: {
          with: {
            items: true
          }
        }
      }
    });

    return {
      success: true,
      activeSession: session,
      table: { id: table.id, name: table.name }
    };
  }, {
    query: t.Object({ t: t.String() })
  })

  /**
   * GET /v1/orders/limit-status/:slug
   * Fetch current monthly order limit and checks if tenant exceeded limits.
   */
  .get('/limit-status/:slug', async ({ params: { slug } }) => {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const meter = await billingService.getOrCreateActiveMeter(tenant.id);
    const maxOrders = tenant.maxOrdersPerMonth;
    const isExceeded = tenant.plan === 'BASIC' && meter.orderCount >= maxOrders;

    return {
      success: true,
      orderCount: meter.orderCount,
      maxOrders,
      limitExceeded: isExceeded,
    };
  })

  /**
   * GET /v1/orders/public/status/:orderId
   * Fetch the current status of an order for public tracking.
   */
  .get('/public/status/:orderId', async ({ params: { orderId } }) => {
    try {
      const status = await ordersService.getPublicOrderStatus(orderId);
      return { success: true, data: status };
    } catch (err: any) {
      return { success: false, error: err.message || 'Order not found' };
    }
  })

  /**
   * GET /v1/orders/public/status/:orderId/sse
   * Streams live KOT updates for this order via Server-Sent Events.
   */
  .get('/public/status/:orderId/sse', ({ params: { orderId }, request }) => {
    return new Stream(async (stream) => {
      stream.event = 'ping';
      stream.send('connected');

      // The callback to execute when a KOT is updated
      const onStatusUpdated = (payload: any) => {
        const eventOrderId = payload.kot?.orderId || payload.order?.id || payload.orderId;
        if (eventOrderId === orderId) {
          // Re-fetch the full public status to ensure the client gets everything they need
          ordersService.getPublicOrderStatus(orderId).then((fullStatus) => {
            stream.event = 'status_update';
            stream.send(JSON.stringify(fullStatus));
          }).catch(() => {}); // ignore error
        }
      };

      // We listen to the global EVENT bus for KOT updates
      eventBus.on(EVENTS.KOT_UPDATED, onStatusUpdated);

      // Clean up the listener when the connection drops
      request.signal.addEventListener('abort', () => {
        eventBus.off(EVENTS.KOT_UPDATED, onStatusUpdated);
      });
    });
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
    async ({ body, user, set }) => {
      try {
        const orderResult = await ordersService.placeOrder(user!.tenantId!, body);
        return { success: true, order: orderResult.order, kot: orderResult.kot };
      } catch (error: any) {
        set.status = 400;
        return { success: false, error: error.message };
      }
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
        mode: t.Optional(t.Union([
          t.Literal('dine_in'),
          t.Literal('takeaway'),
          t.Literal('delivery'),
        ])),
        paymentStatus: t.Optional(t.Union([
          t.Literal('pending'),
          t.Literal('paid'),
          t.Literal('failed'),
          t.Literal('refunded'),
          t.Literal('partially_refunded'),
        ])),
        paymentMethod: t.Optional(t.Union([
          t.Literal('razorpay'),
          t.Literal('cash'),
          t.Literal('upi'),
          t.Literal('wallet'),
        ])),
        tableNumber: t.Optional(t.String()),
        qrToken: t.Optional(t.String()),
        note: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            menuItemId: t.String(),
            quantity: t.Number({ minimum: 1 }),
            fulfillmentMode: t.Optional(t.Union([
              t.Literal('dine_in'),
              t.Literal('takeaway'),
              t.Literal('delivery')
            ])),
          })
        ),
      }),
    }
  )

  /**
   * Updates an existing order's items (for Dine-in modifications).
   */
  .patch('/:id/items', async ({ params: { id }, body, user, set }) => {
    try {
      const result = await ordersService.updateOrderItems(user!.tenantId!, id, body);
      return { success: true, order: result.order, kot: result.kot };
    } catch (error: any) {
      set.status = 400;
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      items: t.Array(
        t.Object({
          menuItemId: t.String(),
          quantity: t.Number({ minimum: 1 }),
          fulfillmentMode: t.Optional(t.Union([
            t.Literal('dine_in'),
            t.Literal('takeaway'),
            t.Literal('delivery')
          ])),
        })
      ),
    })
  })

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
        query.cursor,
        query.paymentStatus
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
        paymentStatus: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /v1/orders/kots/active
   * Retrieves active KOTs for a branch.
   */
  .get(
    '/kots/active',
    async ({ query }) => {
      const kots = await ordersService.getActiveKOTs(query.branchId);
      return {
        success: true,
        data: kots,
      };
    },
    {
      query: t.Object({
        branchId: t.String(),
      }),
    }
  )

  /**
   * PATCH /v1/orders/kots/:id/status
   * Updates KOT status (e.g. pending -> preparing, preparing -> ready)
   */
  .patch(
    '/kots/:id/status',
    async ({ params: { id }, body }) => {
      const updated = await ordersService.updateKOTStatus(id, body.status);
      return {
        success: true,
        data: updated,
      };
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
  )

  /**
   * PATCH /v1/orders/:id/payment
   * Settles order payment (e.g. POS "In-Hand" payment).
   */
  .patch(
    '/:id/payment',
    async ({ params: { id }, body }) => {
      const updated = await ordersService.updatePaymentStatus(id, body.paymentStatus, body.paymentMethod);
      return {
        success: true,
        data: updated,
      };
    },
    {
      body: t.Object({
        paymentStatus: t.Union([
          t.Literal('pending'),
          t.Literal('paid'),
          t.Literal('failed'),
          t.Literal('refunded'),
          t.Literal('partially_refunded'),
        ]),
        paymentMethod: t.Optional(t.Union([
          t.Literal('razorpay'),
          t.Literal('cash'),
          t.Literal('upi'),
          t.Literal('wallet'),
        ])),
      }),
    }
  );
