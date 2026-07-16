# Tenant Support & Ticketing Architecture (Platform-M7)

**Date:** 2026-07-16
**Status:** Implemented

## 1. Overview
The Tenant Support subsystem (Platform-M7) empowers franchisees to report bugs, request features, or ask for help directly from the Admin Dashboard, which are then triaged by Platform administrators.

## 2. Backend (`kwickly-api`)
The backend architecture relies on two tables within the PostgreSQL database (`support.ts`):
- `support_tickets`: Tracks the parent thread, including `tenantId`, `status` (OPEN, IN_PROGRESS, RESOLVED), `priority`, and `category`.
- `ticket_messages`: Tracks individual conversational replies, linking to the parent `ticketId` and the `senderId`.

### Controllers & Services
- **Tenant Scope:** Tenants can fetch their own tickets via `GET /v1/support/tickets` and create new ones via `POST /v1/support/tickets`. They can append messages to an existing thread.
- **Platform Scope:** Platform administrators can fetch tickets across all tenants via `GET /v1/platform/support/tickets`. They can update ticket statuses via `PATCH /v1/platform/support/tickets/:id/status`.

### Timestamping
When a new message is appended to a ticket thread via `ticket_messages`, the parent `support_tickets` record has its `updatedAt` timestamp bumped. This ensures tickets with recent activity always bubble to the top of the UI list.

## 3. Frontend (`kwickly-admin-web`)
The frontend is built using standard React Query hooks (`useSupport.ts`).

### Conversational UI (TicketThreadModal)
To view a ticket's message thread, the user clicks a row in the ticket table. This triggers the `TicketThreadModal.tsx` component, which fetches the full details via the `useTicketDetails` hook.
- **Unified Component:** The modal is smart enough to adapt based on an `isPlatform` prop. 
- **Tenant View:** Tenants can only read the thread and post new messages.
- **Platform View:** Admins are presented with a status toggle dropdown in the modal header, allowing them to advance the state of the ticket dynamically without leaving the thread.

## 4. Future Enhancements (Pipeline)
- **Image Attachments:** Support for attaching screenshots to messages has been deferred to Platform-M10 (Infrastructure/Cloud Storage integration).
