import { Elysia, t } from 'elysia';
import { tablesService } from './tables.service';

export const tablesController = new Elysia({ prefix: '/v1/tables' })
  .get('/', async ({ query }) => {
    return await tablesService.getTables(query.branchId);
  }, {
    query: t.Object({ branchId: t.String() })
  })

  .post('/', async ({ body, headers }) => {
    // For now we assume tenantId is sent in headers or resolved via middleware.
    // Given the Elysia setup here, we mock it or extract it.
    // In a real setup, RBAC middleware attaches this to the context.
    const tenantId = headers['x-tenant-id'] || ''; // placeholder for auth extraction
    if (!tenantId) throw new Error('Unauthorized');
    return await tablesService.createTable(tenantId, body.branchId, body);
  }, {
    body: t.Object({
      branchId: t.String(),
      name: t.String(),
      capacity: t.Optional(t.Number()),
      sortOrder: t.Optional(t.Number()),
    })
  })

  .patch('/:id', async ({ params, body }) => {
    return await tablesService.updateTable(params.id, body.branchId, body);
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

  .delete('/:id', async ({ params, query }) => {
    await tablesService.deleteTable(params.id, query.branchId);
    return { success: true };
  }, {
    query: t.Object({ branchId: t.String() })
  })

  .post('/:id/regenerate-qr', async ({ params, body }) => {
    return await tablesService.regenerateQrToken(params.id, body.branchId);
  }, {
    body: t.Object({ branchId: t.String() })
  })

  .post('/sessions/:id/close', async ({ params, body }) => {
    return await tablesService.closeSession(params.id, body.branchId);
  }, {
    body: t.Object({ branchId: t.String() })
  });
