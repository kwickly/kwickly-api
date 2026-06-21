import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { supportTickets, ticketMessages } from '../../db/schema/support.ts';

export class SupportService {
  async createTicket(tenantId: string, createdById: string, payload: { subject: string; description: string; priority: any; category: any }) {
    const [ticket] = await db.insert(supportTickets).values({
      tenantId,
      createdById,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority,
      category: payload.category,
      status: 'OPEN',
    }).returning();
    
    return ticket;
  }

  async getTicketsForTenant(tenantId: string) {
    return db.query.supportTickets.findMany({
      where: eq(supportTickets.tenantId, tenantId),
      orderBy: [desc(supportTickets.createdAt)],
      with: {
        createdBy: { columns: { id: true, name: true, email: true } },
        assignedTo: { columns: { id: true, name: true, email: true } },
      }
    });
  }

  async getAllTickets() {
    return db.query.supportTickets.findMany({
      orderBy: [desc(supportTickets.createdAt)],
      with: {
        tenant: { columns: { id: true, name: true } },
        createdBy: { columns: { id: true, name: true, email: true } },
        assignedTo: { columns: { id: true, name: true, email: true } },
      }
    });
  }

  async getTicketDetails(ticketId: string, tenantId?: string) {
    const conditions = [eq(supportTickets.id, ticketId)];
    if (tenantId) {
      conditions.push(eq(supportTickets.tenantId, tenantId));
    }
    
    const ticket = await db.query.supportTickets.findFirst({
      where: and(...conditions),
      with: {
        tenant: { columns: { id: true, name: true } },
        createdBy: { columns: { id: true, name: true, email: true } },
        assignedTo: { columns: { id: true, name: true, email: true } },
      }
    });
    
    if (!ticket) return null;
    
    const messages = await db.query.ticketMessages.findMany({
      where: eq(ticketMessages.ticketId, ticketId),
      orderBy: [desc(ticketMessages.createdAt)], // Oldest to newest inside the UI usually, but let's send descending and client reverses or sorts
      with: {
        sender: { columns: { id: true, name: true, email: true, role: true } }
      }
    });
    
    return { ...ticket, messages };
  }

  async updateTicketStatus(ticketId: string, status: any) {
    const [updated] = await db.update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return updated;
  }

  async assignTicket(ticketId: string, assignedToId: string | null) {
    const [updated] = await db.update(supportTickets)
      .set({ assignedToId, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return updated;
  }

  async addMessage(ticketId: string, senderId: string, message: string) {
    // Also bump the ticket updatedAt
    await db.update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));
      
    const [msg] = await db.insert(ticketMessages).values({
      ticketId,
      senderId,
      message,
    }).returning();
    
    return msg;
  }
}
