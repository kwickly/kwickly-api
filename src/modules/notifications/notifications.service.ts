import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { notificationTemplates, notificationLogs } from '../../db/schema/notifications';
import { logger } from '../../shared/logger';

export class NotificationService {
  /**
   * Send a notification based on a template
   */
  async sendFromTemplate(tenantId: string, userId: string, templateName: string, data: Record<string, any>) {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(and(eq(notificationTemplates.tenantId, tenantId), eq(notificationTemplates.name, templateName)))
      .execute();

    if (!template) throw new Error(`Template ${templateName} not found`);

    // Basic Handlebars-style replacement
    let body = template.body;
    Object.entries(data).forEach(([key, value]) => {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    let subject = template.subject || '';
    Object.entries(data).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Log the intent
    const [log] = await db
      .insert(notificationLogs)
      .values({
        tenantId,
        userId,
        channel: template.channel,
        subject,
        body,
        status: 'PENDING',
      })
      .returning();

    // Trigger the actual send (Mocked for now)
    try {
      await this.mockProviderSend(template.channel, userId, subject, body);
      
      await db.update(notificationLogs)
        .set({ status: 'SENT', sentAt: new Date() })
        .where(eq(notificationLogs.id, log.id));
    } catch (e: any) {
      logger.error({ err: e, logId: log.id }, 'Notification Send Failed');
      await db.update(notificationLogs)
        .set({ status: 'FAILED', metadata: { error: e.message } })
        .where(eq(notificationLogs.id, log.id));
    }
  }

  private async mockProviderSend(channel: string, userId: string, subject: string, body: string) {
    console.log(`[NOTIFICATION] Sending ${channel} to User ${userId}`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Create a new notification template
   */
  async createTemplate(tenantId: string, payload: {
    name: string;
    channel: 'PUSH' | 'WHATSAPP' | 'EMAIL' | 'SMS';
    subject?: string;
    body: string;
  }) {
    const [template] = await db
      .insert(notificationTemplates)
      .values({
        tenantId,
        ...payload,
      })
      .returning();
    return template;
  }
}
