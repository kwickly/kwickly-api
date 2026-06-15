import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';
import { MenusService } from './menus.service';

const menusService = new MenusService();

/**
 * Menus Controller
 * Provides RESTful endpoints for managing and retrieving Restaurant Menus.
 * Base Path: /v1/menus
 */
export const menusController = new Elysia({ prefix: '/v1/menus' })
  .use(authPlugin)

  /**
   * GET /v1/menus/:branchId
   * Public-facing (or customer-app facing) endpoint to fetch the highly-cached nested menu.
   * Note: We use auth tenantId here for the B2B portal preview, but in production for customers, 
   * tenantId might be inferred from the branchId directly.
   */
  .get('/:branchId', async ({ params: { branchId }, user }) => {
    // In a real app, this endpoint might be totally public, but we filter by tenantId from auth for B2B portal usage here.
    const data = await menusService.getMenu(user!.tenantId!, branchId);
    return { success: true, data };
  })

  .use(requireRoles(['admin', 'manager']))

  /**
   * POST /v1/menus/categories
   * Creates a new menu category. Restricted to Admins and Managers.
   */
  .post('/categories', async ({ body, user }) => {
    const data = await menusService.createCategory(user!.tenantId!, body);
    return { success: true, data, message: 'Category created' };
  }, {
    body: t.Object({
      name: t.String(),
      sortOrder: t.Optional(t.Number()),
    })
  })

  /**
   * POST /v1/menus/items
   * Creates a new menu item inside a category. Restricted to Admins and Managers.
   */
  .post('/items', async ({ body, user }) => {
    const data = await menusService.createMenuItem(user!.tenantId!, body);
    return { success: true, data, message: 'Menu item created' };
  }, {
    body: t.Object({
      categoryId: t.String(),
      name: t.String(),
      price: t.String(), // Numeric type passed as string to avoid floating point issues
      isVeg: t.Optional(t.Boolean()),
      description: t.Optional(t.String()),
    })
  })

  /**
   * PATCH /v1/menus/items/:id
   * Updates an existing menu item (e.g. changing price, or toggling isActive for out-of-stock).
   * Expects an 'x-branch-id' header to know which Redis cache to invalidate.
   */
  .patch('/items/:id', async ({ params: { id }, body, user, headers }) => {
    // We pass branchId from headers or body to know which cache to invalidate
    const branchId = headers['x-branch-id'] || 'default';
    const data = await menusService.updateMenuItem(user!.tenantId!, branchId, id, body);
    return { success: true, data, message: 'Menu item updated' };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      price: t.String(),
      isActive: t.Boolean(),
    }))
  });
