import { Elysia, t } from 'elysia';
import { CombosService } from './combos.service';
import { requireAuth } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';

const combosService = new CombosService();

export const combosController = new Elysia({ prefix: '/v1/combos' })
  .use(requireAuth)
  
  // Public-facing for customers (assuming they are authenticated via customer app)
  .get('/', async ({ user, query }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const combos = await combosService.getCombos(user.tenantId, query.branchId);
    return { success: true, data: combos };
  }, {
    query: t.Object({
      branchId: t.Optional(t.String()),
    })
  })

  // Protected Admin/Manager endpoints
  .use(requireRoles(['super_admin', 'tenant_owner', 'manager']))
  
  .post('/', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const combo = await combosService.createCombo(user.tenantId, body);
    return { success: true, data: combo };
  }, {
    body: t.Object({
      branchId: t.Optional(t.String()),
      name: t.String(),
      description: t.Optional(t.String()),
      price: t.String(),
      items: t.Array(t.Object({
        menuItemId: t.String(),
        quantity: t.Number(),
      })),
    })
  });
