import { Elysia, t } from 'elysia';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';
import { BranchesService } from './branches.service.ts';
import { db } from '../../db';
import { tenants } from '../../db/schema/tenants';
import { branches } from '../../db/schema/branches';
import { eq, and } from 'drizzle-orm';

const branchesService = new BranchesService();

/**
 * Branches Controller
 * Provides RESTful endpoints for managing physical restaurant locations.
 * Base Path: /v1/branches
 */
export const branchesController = new Elysia({ prefix: '/v1/branches' })
  /**
   * GET /v1/branches/public/:slug
   * Public-facing endpoint for customers to view branch details and open/close status.
   */
  .get('/public/:slug', async ({ params: { slug }, query }) => {
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) return { success: false, error: 'Restaurant not found' };

    let branchIdCondition = undefined;
    if (query.branchId && query.branchId !== 'default') {
      branchIdCondition = eq(branches.id, query.branchId);
    }

    const [branch] = await db.select().from(branches).where(
      branchIdCondition 
        ? and(eq(branches.tenantId, tenant.id), branchIdCondition)
        : eq(branches.tenantId, tenant.id)
    ).limit(1);

    if (!branch) return { success: false, error: 'Branch not found' };

    const isOpen = branchesService.isBranchOpen(branch as any);
    
    return { 
      success: true, 
      data: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        openingHours: branch.openingHours,
        timezone: branch.timezone,
        isOpen
      }
    };
  })
  
  .use(requireAuth)

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
      status: t.Union([t.Literal('ACTIVE'), t.Literal('TEMPORARILY_CLOSED'), t.Literal('PERMANENTLY_CLOSED')]),
    }))
  });
