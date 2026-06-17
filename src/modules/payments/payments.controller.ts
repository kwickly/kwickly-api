import { Elysia, t } from 'elysia';
import { PaymentsService } from './payments.service';
import { requireAuth } from '../auth/auth.guard.ts';

const paymentsService = new PaymentsService();

export const paymentsController = new Elysia({ prefix: '/v1/payments' })
  // Public webhook endpoint (No auth required, relies on HMAC signature)
  .post('/webhook', async ({ body, headers }) => {
    const signature = headers['x-razorpay-signature'];
    if (!signature) throw new Error('Missing webhook signature');

    const bodyText = JSON.stringify(body); // In reality, you'd want the raw body string from Elysia
    
    await paymentsService.handleWebhook(signature as string, bodyText, body);
    return { status: 'ok' };
  })

  // Protected endpoints
  .use(requireAuth)
  .post('/intent', async ({ body }) => {
    // Both orders and subscriptions will call this
    const payment = await paymentsService.createIntent(body as any);
    return { success: true, data: payment };
  }, {
    body: t.Object({
      orderId: t.Optional(t.String()),
      subscriptionId: t.Optional(t.String()),
      amount: t.String(),
      currency: t.Optional(t.String()),
      method: t.Union([t.Literal('razorpay'), t.Literal('cash'), t.Literal('upi'), t.Literal('wallet')]),
    })
  });
