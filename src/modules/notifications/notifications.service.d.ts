export declare class NotificationService {
    /**
     * Send a notification based on a template
     */
    sendFromTemplate(tenantId: string, userId: string, templateName: string, data: Record<string, any>): Promise<void>;
    private mockProviderSend;
    /**
     * Create a new notification template
     */
    createTemplate(tenantId: string, payload: {
        name: string;
        channel: 'PUSH' | 'WHATSAPP' | 'EMAIL' | 'SMS';
        subject?: string;
        body: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        channel: "PUSH" | "WHATSAPP" | "EMAIL" | "SMS";
        subject: string | null;
        body: string;
    }>;
}
