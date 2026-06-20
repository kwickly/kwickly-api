import { Elysia, t } from 'elysia';
import { HardwareService } from './hardware.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';

const hardwareService = new HardwareService();

export const hardwareController = new Elysia({ prefix: '/v1/hardware' })
  .use(requireAuth)

  /**
   * GET /v1/hardware/receipts/:orderId
   * Returns the ESC/POS payload for a specific order.
   */
  .get(
    '/receipts/:orderId',
    async ({ params: { orderId }, user }) => {
      const base64Payload = await hardwareService.generateReceiptPayload(user!.tenantId!, orderId);

      return {
        success: true,
        data: {
          payload: base64Payload,
          encoding: 'base64',
          mimeType: 'application/octet-stream',
        },
      };
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
    }
  );
