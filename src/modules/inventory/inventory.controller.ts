import { Elysia, t } from 'elysia';
import { InventoryService } from './inventory.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

const inventoryService = new InventoryService();

export const inventoryController = new Elysia({ prefix: '/v1/inventory' })
  .use(requireAuth)
  .use(requirePermission('inventory:write'))

  .get('/materials', async ({ user }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const materials = await inventoryService.getMaterials(user.tenantId);
    return { success: true, data: materials };
  })

  .post('/materials', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const material = await inventoryService.addMaterial(user.tenantId, body as any);
    return { success: true, data: material };
  }, {
    body: t.Object({
      name: t.String(),
      uom: t.Union([
        t.Literal('KG'), t.Literal('GRAM'), t.Literal('LITER'), 
        t.Literal('MILLILITER'), t.Literal('PIECE'), t.Literal('BOX')
      ]),
    })
  })

  .get('/stock/:branchId', async ({ user, params }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const stock = await inventoryService.getStock(user.tenantId, params.branchId);
    return { success: true, data: stock };
  }, {
    params: t.Object({
      branchId: t.String(),
    })
  })

  .post('/stock/adjust', async ({ user, body }) => {
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const ledger = await inventoryService.adjustStock(user.tenantId, body.branchId, body);
    return { success: true, data: ledger };
  }, {
    body: t.Object({
      branchId: t.String(),
      rawMaterialId: t.String(),
      quantityChange: t.String(), // can be negative
      reason: t.String(),
    })
  })

  .post('/recipes', async ({ user, body }) => {
    // Only admins/managers should alter recipes, handled by role guard
    const recipe = await inventoryService.linkRecipe(body);
    return { success: true, data: recipe };
  }, {
    body: t.Object({
      menuItemId: t.String(),
      rawMaterialId: t.String(),
      quantityRequired: t.String(),
    })
  });
