import { Elysia, t } from 'elysia';
import { auditService } from './audit.service';
import { requireAuth } from '../auth/auth.guard';
import { requirePermissions } from '../auth/auth.guard';

export const auditController = new Elysia({ prefix: '/v1/audit' })
  .use(requireAuth)
  
  // Protect with a specific permission or default to something high-level
  // Currently requiring 'staff:write' as a placeholder for high-level admin access.
  // Ideally, you might have an 'audit:read' or only allow tenant_owner.
  .use(requirePermissions(['staff:write']))

  .get('/', async ({ user, query }) => {
    try {
      if (!user) throw new Error('Unauthorized');
      const tenantId = user.tenantId;
      if (!tenantId) throw new Error('Tenant ID missing');

      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const offset = query.offset ? parseInt(query.offset, 10) : 0;

      const result = await auditService.getAuditLogs(tenantId, limit, offset);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Fetch audit logs error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch audit logs',
      };
    }
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
    })
  });
