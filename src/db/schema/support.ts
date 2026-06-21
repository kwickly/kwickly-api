import { pgTable, text, timestamp, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['BUG', 'FEATURE_REQUEST', 'BILLING', 'ONBOARDING', 'OTHER']);

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'cascade' }),
  assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }), // Platform staff member
  
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  status: ticketStatusEnum('status').default('OPEN').notNull(),
  priority: ticketPriorityEnum('priority').default('MEDIUM').notNull(),
  category: ticketCategoryEnum('category').default('OTHER').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  message: text('message').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
