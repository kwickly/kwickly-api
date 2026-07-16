import { task } from '@trigger.dev/sdk/v3';
import { PushNotificationService } from '../modules/notifications/push.service.ts';

const pushService = new PushNotificationService();

export const sendPushNotification = task({
  id: 'send-push-notification',
  retry: {
    maxAttempts: 3,
  }, // Auto retry if FCM is down
  run: async (payload: { tenantId: string; userId: string; title: string; body: string; data?: Record<string, string> }) => {
    const { tenantId, userId, title, body, data } = payload;
    
    // The service handles fetching the user's FCM tokens and sending the push via firebase-admin
    const response = await pushService.sendToUser(tenantId, userId, { title, body, data });
    
    return { success: true, response };
  },
});
