import { Elysia, t } from 'elysia';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { MenusService } from './menus.service.ts';
import { eventBus, EVENTS } from '../../shared/events.ts';

const menusService = new MenusService();
import { db } from '../../db';
import { tenants } from '../../db/schema/tenants';
import { eq } from 'drizzle-orm';

/**
 * Menus Controller
 * Provides RESTful endpoints for managing and retrieving Restaurant Menus.
 * Base Path: /v1/menus
 */
export const menusController = new Elysia({ prefix: '/v1/menus' })
  /**
   * GET /v1/menus/public/:slug
   * Public-facing endpoint for the customer app to fetch the menu by tenant slug.
   * Does NOT require authentication.
   */
  .get('/public/:slug', async ({ params: { slug }, query }) => {
    // Look up tenantId by slug
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) {
      return { success: false, error: 'Restaurant not found' };
    }
    
    // Default to a 'default' branch if not provided (for single-branch tenants)
    const branchId = query.branchId ? (query.branchId as string) : 'default';
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 100; // Large limit for public menu
    
    const result = await menusService.getMenu(tenant.id, branchId, page, limit, query.search as string | undefined);
    return { success: true, ...result };
  }, {
    query: t.Object({
      branchId: t.Optional(t.String()),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  // --- Auth Required Below Here ---
  .use(requireAuth)

  /**
   * GET /v1/menus/:branchId
   * Public-facing (or customer-app facing) endpoint to fetch the highly-cached nested menu.
   * Note: We use auth tenantId here for the B2B portal preview, but in production for customers, 
   * tenantId might be inferred from the branchId directly.
   */
  .get('/:branchId', async ({ params: { branchId }, user, query }) => {
    // In a real app, this endpoint might be totally public, but we filter by tenantId from auth for B2B portal usage here.
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await menusService.getMenu(user!.tenantId!, branchId, page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  .use(requirePermission('menu:write'))

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
      isJain: t.Optional(t.Boolean()),
      isGlutenFree: t.Optional(t.Boolean()),
      spiceLevel: t.Optional(t.Number()),
      isBestseller: t.Optional(t.Boolean()),
      isChefSpecial: t.Optional(t.Boolean()),
      isRestaurantSpecial: t.Optional(t.Boolean()),
      isNew: t.Optional(t.Boolean()),
      isPopular: t.Optional(t.Boolean()),
      isLimitedEdition: t.Optional(t.Boolean()),
      isHealthyChoice: t.Optional(t.Boolean()),
      calories: t.Optional(t.Number()),
      servingSize: t.Optional(t.String()),
      ingredients: t.Optional(t.Array(t.String())),
      allergens: t.Optional(t.Array(t.String())),
      protein: t.Optional(t.String()),
      carbs: t.Optional(t.String()),
      fat: t.Optional(t.String()),
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
      status: t.Union([t.Literal('AVAILABLE'), t.Literal('OUT_OF_STOCK'), t.Literal('HIDDEN')]),
      categoryId: t.String(),
      isVeg: t.Boolean(),
      isJain: t.Boolean(),
      isGlutenFree: t.Boolean(),
      spiceLevel: t.Number(),
      isBestseller: t.Boolean(),
      isChefSpecial: t.Boolean(),
      isRestaurantSpecial: t.Boolean(),
      isNew: t.Boolean(),
      isPopular: t.Boolean(),
      isLimitedEdition: t.Boolean(),
      isHealthyChoice: t.Boolean(),
      calories: t.Number(),
      servingSize: t.String(),
      ingredients: t.Array(t.String()),
      allergens: t.Array(t.String()),
      protein: t.String(),
      carbs: t.String(),
      fat: t.String(),
      description: t.String(),
    }))
  })
  
  /**
   * DELETE /v1/menus/items/:id
   * Soft deletes a menu item.
   */
  .delete('/items/:id', async ({ params: { id }, user, headers }) => {
    const branchId = headers['x-branch-id'] || 'default';
    const data = await menusService.deleteMenuItem(user!.tenantId!, branchId, id);
    return { success: true, data, message: 'Menu item deleted' };
  })

  /**
   * PATCH /v1/menus/categories/:id
   * Updates a category name or order.
   */
  .patch('/categories/:id', async ({ params: { id }, body, user }) => {
    const data = await menusService.updateCategory(user!.tenantId!, id, body);
    return { success: true, data, message: 'Category updated' };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      sortOrder: t.Number(),
      status: t.Union([t.Literal('AVAILABLE'), t.Literal('OUT_OF_STOCK'), t.Literal('HIDDEN')])
    }))
  })

  /**
   * DELETE /v1/menus/categories/:id
   * Deletes a category and uncategorizes its items.
   */
  .delete('/categories/:id', async ({ params: { id }, user }) => {
    const data = await menusService.deleteCategory(user!.tenantId!, id);
    return { success: true, data, message: 'Category deleted' };
  })
  
  /**
   * POST /v1/menus/addons
   * Creates a new global or item-specific modifier/addon.
   */
  .post('/addons', async ({ body, user }) => {
    const data = await menusService.createAddon(user!.tenantId!, body);
    return { success: true, data, message: 'Addon created' };
  }, {
    body: t.Object({
      name: t.String(),
      price: t.String(),
      menuItemId: t.Optional(t.String()),
    })
  })

  /**
   * GET /v1/menus/addons
   * Fetches all addons/modifiers for a specific tenant.
   */
  .get('/addons', async ({ user, query }) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await menusService.getAddons(user!.tenantId!, page, limit, query.search);
    return { success: true, ...result };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    })
  })

  /**
   * POST /v1/menus/items/:id/variants
   * Creates a new variant for a menu item.
   */
  .post('/items/:id/variants', async ({ params: { id }, body, user, headers }) => {
    const branchId = headers['x-branch-id'] || 'default';
    const data = await menusService.createVariant(user!.tenantId!, branchId, {
      ...body,
      menuItemId: id,
    });
    return { success: true, data, message: 'Variant created' };
  }, {
    body: t.Object({
      name: t.String(),
      priceDelta: t.String(),
      isDefault: t.Optional(t.Boolean()),
    })
  })

  /**
   * PATCH /v1/menus/variants/:id
   * Updates a variant.
   */
  .patch('/variants/:id', async ({ params: { id }, body, user, headers }) => {
    const branchId = headers['x-branch-id'] || 'default';
    const data = await menusService.updateVariant(user!.tenantId!, branchId, id, body);
    return { success: true, data, message: 'Variant updated' };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      priceDelta: t.String(),
      isDefault: t.Boolean(),
    }))
  })

  /**
   * DELETE /v1/menus/variants/:id
   * Soft deletes a variant.
   */
  .delete('/variants/:id', async ({ params: { id }, user, headers }) => {
    const branchId = headers['x-branch-id'] || 'default';
    const data = await menusService.deleteVariant(user!.tenantId!, branchId, id);
    return { success: true, data, message: 'Variant deleted' };
  })

  /**
   * POST /v1/menus/sync/:branchId
   * Emits a WebSocket event to all devices connected to the branch's room.
   */
  .post('/sync/:branchId', async ({ params: { branchId }, user }) => {
    // Fire event bus which is wired to WebSockets in index.ts
    eventBus.emit(EVENTS.MENU_SYNC, { branchId });
    return { success: true, message: 'Sync event dispatched' };
  });
