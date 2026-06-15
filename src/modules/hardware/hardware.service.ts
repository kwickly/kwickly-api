import { eq } from 'drizzle-orm';
import { db } from '../../shared/db.ts';
import { orders, orderItems } from '../../shared/schema/orders.ts';

export class HardwareService {
  /**
   * Generates a base64 encoded ESC/POS payload for a thermal printer.
   * In a real production scenario, you would use a library like 'escpos' or 'receiptline'
   * to construct the exact byte array.
   */
  async generateReceiptPayload(tenantId: string, orderId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order || order.tenantId !== tenantId) {
      throw new Error('Order not found');
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    // ESC/POS Commands (Simplified for demonstration)
    const ESC = '\\x1b';
    const GS = '\\x1d';
    const INIT = `${ESC}@`;
    const ALIGN_CENTER = `${ESC}a\\x01`;
    const ALIGN_LEFT = `${ESC}a\\x00`;
    const BOLD_ON = `${ESC}E\\x01`;
    const BOLD_OFF = `${ESC}E\\x00`;
    const CUT = `${GS}V\\x41\\x00`;

    let payload = INIT;
    payload += ALIGN_CENTER + BOLD_ON + 'KWICKLY POS\\n' + BOLD_OFF;
    payload += '--------------------------\\n';
    payload += `Order ID: ${order.id.slice(0, 8)}\\n`;
    payload += `Date: ${order.createdAt.toISOString()}\\n`;
    payload += '--------------------------\\n';
    
    payload += ALIGN_LEFT;
    for (const item of items) {
      payload += `${item.quantity}x ${item.name.padEnd(15)} $${item.total}\\n`;
    }
    
    payload += '--------------------------\\n';
    payload += ALIGN_CENTER + BOLD_ON + `TOTAL: $${order.total}\\n` + BOLD_OFF;
    payload += '\\n\\n' + CUT;

    // The client (Web POS or Mobile) will decode this Base64 string into a Uint8Array 
    // and send it directly to the printer via WebUSB or Bluetooth.
    return Buffer.from(payload, 'utf-8').toString('base64');
  }
}
