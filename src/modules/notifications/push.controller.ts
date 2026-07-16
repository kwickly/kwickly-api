import { Elysia, t } from 'elysia';
import { PushNotificationService } from './push.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';

const pushService = new PushNotificationService();

export const pushNotificationsController = new Elysia({ prefix: '/v1/notifications/push' })
  .use(requireAuth)
  .post(
    '/register',
    async ({ body, user }: { body: { token: string; deviceType?: string }; user: any }) => {
      const { token, deviceType } = body;
      await pushService.registerToken(user.tenantId, user.id, token, deviceType);
      return { success: true, message: 'Push token registered successfully' };
    },
    {
      body: t.Object({
        token: t.String(),
        deviceType: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    '/unregister',
    async ({ body }: { body: { token: string } }) => {
      const { token } = body;
      await pushService.unregisterToken(token);
      return { success: true, message: 'Push token unregistered successfully' };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    }
  );
