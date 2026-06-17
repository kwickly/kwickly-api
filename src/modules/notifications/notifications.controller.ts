import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { NotificationService } from './notifications.service.ts';

const notificationService = new NotificationService();

export const notificationsController = new Elysia({ prefix: '/v1/notifications' })
  .use(authPlugin)
  .use(requirePermission('settings:manage'))

  /**
   * POST /v1/notifications/templates
   * Create a new reusable notification template.
   */
  .post('/templates', async ({ body, user }) => {
    const data = await notificationService.createTemplate(user!.tenantId!, body as any);
    return { success: true, data };
  }, {
    body: t.Object({
      name: t.String(),
      channel: t.Union([
        t.Literal('PUSH'),
        t.Literal('WHATSAPP'),
        t.Literal('EMAIL'),
        t.Literal('SMS')
      ]),
      subject: t.Optional(t.String()),
      body: t.String(),
    })
  })

  /**
   * POST /v1/notifications/send
   * Manually trigger a notification to a specific user using a template.
   */
  .post('/send', async ({ body, user }) => {
    await notificationService.sendFromTemplate(user!.tenantId!, body.userId, body.templateName, body.data);
    return { success: true, message: 'Notification queued' };
  }, {
    body: t.Object({
      userId: t.String(),
      templateName: t.String(),
      data: t.Record(t.String(), t.Any())
    })
  });
