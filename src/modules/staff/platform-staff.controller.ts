import { Elysia, t } from 'elysia';
import { StaffService } from './staff.service.ts';
import { PlatformService } from '../platform/platform.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { checkPermission } from '../auth/rbac.guard.ts';

const staffService = new StaffService();
const platformService = new PlatformService();

export const platformStaffController = new Elysia({ prefix: '/v1/platform/staff' })
  .use(requireAuth)
  
  // Enforce global platform owner role manually or via permission
  .onBeforeHandle(({ user, set }) => {
    if (!user || (user.role !== 'platform_owner' && user.role !== 'super_admin')) {
      set.status = 403;
      return { success: false, error: 'Platform admin access required' };
    }
  })

  .get('', async () => {
    const data = await platformService.getPlatformStaff();
    return { success: true, data };
  })
  .get('/', async () => {
    const data = await platformService.getPlatformStaff();
    return { success: true, data };
  })

  .get('/roles', async ({ set }) => {
    // For platform roles, we pass null as tenantId
    const roles = await staffService.getRoles(null as any);
    return { success: true, data: roles };
  })

  .patch('/roles/:id', async ({ user, params, body, set }) => {
    // Platform role permissions update
    return await staffService.updateRolePermissions(null, params.id, body.permissions, user);
  }, {
    body: t.Object({
      permissions: t.Array(t.String())
    })
  })

  .delete('/roles/:id', async ({ user, params }) => {
    return await staffService.deleteRole(null, params.id, user);
  })

  .get('/timesheets', async ({ query }) => {
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.offset ? parseInt(query.offset) : 0;
    const data = await staffService.getPlatformTimesheets({ limit, offset });
    
    // Map the relational data to a flat structure if expected by frontend
    const mappedData = data.map(ts => ({
      ...ts,
      staffName: ts.staff?.name || 'Unknown Staff'
    }));

    return { success: true, data: mappedData };
  }, {
    query: t.Optional(t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    }))
  })

  .patch('/timesheets/:id', async ({ body, params, user }) => {
    const data = await staffService.updateTimesheet(params.id, {
      status: body.status,
      reviewerNotes: body.reviewerNotes,
      reviewedBy: user.id
    });
    return { success: true, data };
  }, {
    body: t.Object({
      status: t.Union([t.Literal('PENDING'), t.Literal('APPROVED'), t.Literal('REJECTED')]),
      reviewerNotes: t.Optional(t.String())
    })
  });
