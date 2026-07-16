import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { db } from '../../db/index.ts';
import { fcmTokens } from '../../db/schema/notifications.ts';
import { eq, and } from 'drizzle-orm';

// Initialize Firebase Admin (Only once)
if (!getApps().length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found. Push notifications will not work.');
    }
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', error);
  }
}

export class PushNotificationService {
  async registerToken(tenantId: string, userId: string, token: string, deviceType?: string) {
    // Check if token already exists
    const existing = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.token, token),
    });

    if (existing) {
      // Update if userId or tenantId changed (e.g. new login on same device)
      if (existing.userId !== userId || existing.tenantId !== tenantId) {
        await db.update(fcmTokens)
          .set({ userId, tenantId, deviceType: deviceType ?? existing.deviceType })
          .where(eq(fcmTokens.id, existing.id));
      }
      return existing;
    }

    // Insert new token
    const [newToken] = await db.insert(fcmTokens)
      .values({
        tenantId,
        userId,
        token,
        deviceType: deviceType ?? null,
      })
      .returning();

    return newToken;
  }

  async unregisterToken(token: string) {
    await db.delete(fcmTokens).where(eq(fcmTokens.token, token));
    return true;
  }

  async sendToUser(tenantId: string, userId: string, payload: { title: string; body: string; data?: Record<string, string> }) {
    if (!getApps().length) {
      console.warn('Firebase Admin not initialized, skipping push notification.');
      return;
    }

    // Get all tokens for this user
    const tokens = await db.query.fcmTokens.findMany({
      where: and(
        eq(fcmTokens.tenantId, tenantId),
        eq(fcmTokens.userId, userId)
      ),
    });

    if (tokens.length === 0) return;

    const deviceTokens = tokens.map((t) => t.token);

    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });

      // Cleanup invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(deviceTokens[idx] as string);
            }
          }
        });

        if (failedTokens.length > 0) {
          for (const token of failedTokens) {
            await this.unregisterToken(token);
          }
        }
      }
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}
