export declare class PaymentsService {
    /**
     * Mock endpoint to create a payment intent.
     * In reality, this would call Razorpay/Stripe API and return their native order ID.
     */
    createIntent(payload: {
        orderId?: string;
        subscriptionId?: string;
        amount: string;
        currency?: string;
        method: 'razorpay' | 'cash' | 'upi' | 'wallet';
    }): Promise<{
        id: string;
        status: "paid" | "pending" | "failed" | "refunded" | "partially_refunded";
        createdAt: Date;
        deletedAt: Date | null;
        currency: string;
        subscriptionId: string | null;
        orderId: string | null;
        amount: string;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        method: "razorpay" | "cash" | "upi" | "wallet";
        refundAmount: string | null;
        failureReason: string | null;
        paidAt: Date | null;
    }>;
    /**
     * Webhook handler to verify Razorpay signature and fulfill the order.
     */
    handleWebhook(signature: string, bodyText: string, payload: any): Promise<{
        success: boolean;
    }>;
}
