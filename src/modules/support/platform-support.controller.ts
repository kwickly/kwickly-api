import { Elysia, t } from 'elysia';
import { requireAuth } from '../auth/auth.guard.ts';
import { SupportService } from './support.service.ts';

const supportService = new SupportService();

export const platformSupportController = new Elysia({ prefix: '/v1/platform/support' })
  .use(requireAuth)
  .onBeforeHandle(({ user, set }) => {
    if (!user || (user.role !== 'platform_owner' && user.role !== 'super_admin')) {
      set.status = 403;
      return { success: false, error: 'Platform admin access required' };
    }
  })
  
  .get('/tickets', async () => {
    const tickets = await supportService.getAllTickets();
    return { success: true, data: tickets };
  })
  
  .get('/tickets/:id', async ({ params, set }) => {
    const ticket = await supportService.getTicketDetails(params.id);
    if (!ticket) {
      set.status = 404;
      return { success: false, error: 'Ticket not found' };
    }
    return { success: true, data: ticket };
  })
  
  .patch('/tickets/:id/status', async ({ params, body }) => {
    const ticket = await supportService.updateTicketStatus(params.id, body.status);
    return { success: true, data: ticket };
  }, {
    body: t.Object({
      status: t.Union([t.Literal('OPEN'), t.Literal('IN_PROGRESS'), t.Literal('WAITING_ON_CUSTOMER'), t.Literal('RESOLVED'), t.Literal('CLOSED')])
    })
  })
  
  .patch('/tickets/:id/assign', async ({ params, body }) => {
    const ticket = await supportService.assignTicket(params.id, body.assignedToId);
    return { success: true, data: ticket };
  }, {
    body: t.Object({
      assignedToId: t.Union([t.String(), t.Null()])
    })
  })
  
  .post('/tickets/:id/messages', async ({ user, params, body }) => {
    const message = await supportService.addMessage(params.id, user!.id, body.message);
    return { success: true, data: message };
  }, {
    body: t.Object({
      message: t.String()
    })
  });
