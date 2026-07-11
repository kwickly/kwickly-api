import { Elysia, t } from 'elysia';
import { requireAuth } from '../auth/auth.guard.ts';
import { SupportService } from './support.service.ts';

const supportService = new SupportService();

export const supportController = new Elysia({ prefix: '/v1/support' })
  .use(requireAuth)
  
  .get('/tickets', async ({ user, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const tickets = await supportService.getTicketsForTenant(user.tenantId);
    return { success: true, data: tickets };
  })
  
  .get('/tickets/:id', async ({ user, params, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const ticket = await supportService.getTicketDetails(params.id, user.tenantId);
    if (!ticket) {
      set.status = 404;
      return { success: false, error: 'Ticket not found' };
    }
    return { success: true, data: ticket };
  })
  
  .post('/tickets', async ({ user, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    const ticket = await supportService.createTicket(user.tenantId, user!.sub, body);
    return { success: true, data: ticket };
  }, {
    body: t.Object({
      subject: t.String(),
      description: t.String(),
      priority: t.Union([t.Literal('LOW'), t.Literal('MEDIUM'), t.Literal('HIGH'), t.Literal('URGENT')]),
      category: t.Union([t.Literal('BUG'), t.Literal('FEATURE_REQUEST'), t.Literal('BILLING'), t.Literal('ONBOARDING'), t.Literal('OTHER')]),
    })
  })
  
  .post('/tickets/:id/messages', async ({ user, params, body, set }) => {
    if (!user || !user.tenantId) {
      set.status = 403;
      return { success: false, error: 'Tenant context required' };
    }
    // Verify ticket belongs to tenant
    const ticket = await supportService.getTicketDetails(params.id, user.tenantId);
    if (!ticket) {
      set.status = 404;
      return { success: false, error: 'Ticket not found' };
    }
    
    const message = await supportService.addMessage(params.id, user!.sub, body.message);
    return { success: true, data: message };
  }, {
    body: t.Object({
      message: t.String()
    })
  });
