export declare class SupportService {
    createTicket(tenantId: string, createdById: string, payload: {
        subject: string;
        description: string;
        priority: any;
        category: any;
    }): Promise<{
        id: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        description: string;
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        subject: string;
        createdById: string | null;
        assignedToId: string | null;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    }>;
    getTicketsForTenant(tenantId: string): Promise<{
        id: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        description: string;
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        subject: string;
        createdById: string | null;
        assignedToId: string | null;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        createdBy: never;
        assignedTo: never;
    }[]>;
    getAllTickets(): Promise<{
        id: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        description: string;
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        subject: string;
        createdById: string | null;
        assignedToId: string | null;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        tenant: never;
        createdBy: never;
        assignedTo: never;
    }[]>;
    getTicketDetails(ticketId: string, tenantId?: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            ticketId: string;
            senderId: string;
            message: string;
            sender: never;
        }[];
        id: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        description: string;
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        subject: string;
        createdById: string | null;
        assignedToId: string | null;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        tenant: never;
        createdBy: never;
        assignedTo: never;
    } | null>;
    updateTicketStatus(ticketId: string, status: any): Promise<{
        id: string;
        tenantId: string | null;
        createdById: string | null;
        assignedToId: string | null;
        subject: string;
        description: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    assignTicket(ticketId: string, assignedToId: string | null): Promise<{
        id: string;
        tenantId: string | null;
        createdById: string | null;
        assignedToId: string | null;
        subject: string;
        description: string;
        status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        category: "BUG" | "FEATURE_REQUEST" | "BILLING" | "ONBOARDING" | "OTHER";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    addMessage(ticketId: string, senderId: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        ticketId: string;
        senderId: string;
        message: string;
    }>;
}
