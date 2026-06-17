import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { BranchesService } from './branches.service.ts';

const branchesService = new BranchesService();

/**
 * Branches Controller
 * Provides RESTful endpoints for managing physical restaurant locations.
 * Base Path: /v1/branches
 */
export const branchesController = new Elysia({ prefix: '/v1/branches' })
  .use(authPlugin)

  /**
   * GET /v1/branches
   * Retrieves all branches associated with the authenticated user's tenant.
   */
  .get('/', async ({ user }) => {
    const data = await branchesService.listBranches(user!.tenantId!);
    return { success: true, data };
  })

  .use(requirePermission('settings:manage'))

  /**
   * POST /v1/branches
   * Creates a new branch. Restricted to Tenant Admins and Managers.
   * Requires strict schema validation on the request body.
   */
  .post('/', async ({ body, user }) => {
    const data = await branchesService.createBranch(user!.tenantId!, body);
    return { success: true, data, message: 'Branch created successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      address: t.Optional(t.String()),
      phone: t.Optional(t.String()),
    })
  })

  /**
   * PATCH /v1/branches/:id
   * Updates an existing branch configuration. Restricted to Tenant Admins and Managers.
   * Invalidates Redis cache upon successful update.
   */
  .patch('/:id', async ({ params: { id }, body, user }) => {
    const data = await branchesService.updateBranch(user!.tenantId!, id, body);
    return { success: true, data, message: 'Branch updated successfully' };
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      address: t.String(),
      phone: t.String(),
      isActive: t.Boolean(),
    }))
  });
