import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db/index';
import { payments } from '../../db/schema/payments';
import { orders } from '../../db/schema/orders';
import { customerSubscriptions } from '../../db/schema/subscriptions';

export class PaymentsService {
  /**
   * Mock endpoint to create a payment intent.
   * In reality, this would call Razorpay/Stripe API and return their native order ID.
   */
  async createIntent(payload: {
    orderId?: string;
    subscriptionId?: string;
    amount: string;
    currency?: string;
    method: 'razorpay' | 'cash' | 'upi' | 'wallet';
  }) {
    // Generate a mock razorpay_order_id
    const rzpOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: payload.orderId || null,
        subscriptionId: payload.subscriptionId || null,
        razorpayOrderId: rzpOrderId,
        method: payload.method,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        status: 'pending',
      })
      .returning();

    return payment;
  }

  /**
   * Webhook handler to verify Razorpay signature and fulfill the order.
   */
  async handleWebhook(signature: string, bodyText: string, payload: any) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback-secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    // Usually, the payload contains payment.captured event
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      await db.transaction(async (tx) => {
        // Find our payment record
        const [paymentRecord] = await tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, razorpayOrderId))
          .execute();

        if (!paymentRecord) throw new Error('Payment record not found');

        // Update payment to paid
        await tx
          .update(payments)
          .set({
            status: 'paid',
            razorpayPaymentId,
            paidAt: new Date(),
          })
          .where(eq(payments.id, paymentRecord.id))
          .execute();

        // Update corresponding Order status to accepted once paid
        if (paymentRecord.orderId) {
          await tx
            .update(orders)
            .set({ status: 'accepted' })
            .where(eq(orders.id, paymentRecord.orderId))
            .execute();
        } else if (paymentRecord.subscriptionId) {
          // In a real flow, you might activate the subscription here
          await tx
            .update(customerSubscriptions)
            .set({ status: 'active' })
            .where(eq(customerSubscriptions.id, paymentRecord.subscriptionId))
            .execute();
        }
      });
    }

    return { success: true };
  }
}
