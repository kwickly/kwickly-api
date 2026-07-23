import { Elysia, t } from 'elysia';
import { tablesService } from './tables.service';
import { requireAuth } from '../auth/auth.guard.ts';

export const tablesController = new Elysia({ prefix: '/v1/tables' })
  .use(requireAuth)
  .get('/', async ({ query, user }) => {
    return await tablesService.getTables(query.branchId, user.tenantId);
  }, {
    query: t.Object({ branchId: t.String() })
  })

  .post('/', async ({ body, user }) => {
    return await tablesService.createTable(user.tenantId, body.branchId, body);
  }, {
    body: t.Object({
      branchId: t.String(),
      name: t.String(),
      capacity: t.Optional(t.Number()),
      sortOrder: t.Optional(t.Number()),
    })
  })

  .patch('/:id', async ({ params, body, user }) => {
    return await tablesService.updateTable(params.id, body.branchId, user.tenantId, body);
  }, {
    body: t.Object({
      branchId: t.String(),
      name: t.Optional(t.String()),
      capacity: t.Optional(t.Number()),
      sortOrder: t.Optional(t.Number()),
      status: t.Optional(t.Union([
        t.Literal('available'),
        t.Literal('occupied'),
        t.Literal('reserved'),
        t.Literal('cleaning')
      ]))
    })
  })

  .delete('/:id', async ({ params, query, user }) => {
    await tablesService.deleteTable(params.id, query.branchId, user.tenantId);
    return { success: true };
  }, {
    query: t.Object({ branchId: t.String() })
  })

  .post('/:id/regenerate-qr', async ({ params, body, user }) => {
    return await tablesService.regenerateQrToken(params.id, body.branchId, user.tenantId);
  }, {
    body: t.Object({ branchId: t.String() })
  })

  .post('/sessions/:id/close', async ({ params, body, user }) => {
    return await tablesService.closeSession(params.id, body.branchId, user.tenantId);
  }, {
    body: t.Object({ branchId: t.String() })
  });
