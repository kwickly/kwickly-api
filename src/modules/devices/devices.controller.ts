import { Elysia, t } from 'elysia';
import { DevicesService } from './devices.service';
import { requireAuth } from '../auth/auth.guard';
import { checkPermission } from '../auth/rbac.guard';
import { db } from '../../db';
import { devices, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '../../shared/audit';

const devicesService = new DevicesService();

export const devicesController = new Elysia({ prefix: '/devices' })
  .use(requireAuth)
  
  // List devices for a branch
  .get('/', async ({ user, query }) => {
    if (!user?.tenantId) throw new Error('Tenant ID required');
    const branchId = query.branchId as string;
    if (!branchId) throw new Error('Branch ID required');
    
    return await devicesService.listDevices(user.tenantId, branchId);
  }, {
    query: t.Object({
      branchId: t.String(),
    }),
    beforeHandle: [checkPermission('settings:manage')],
  })

  // Register a new device
  .post('/', async ({ body, user, request }) => {
    if (!user?.tenantId) throw new Error('Tenant ID required');
    
    const device = await devicesService.registerDevice({
      tenantId: user.tenantId,
      branchId: body.branchId,
      name: body.name,
      type: body.type as 'POS' | 'KDS',
    });

    await logAudit({
      tenantId: user.tenantId,
      userId: user.sub,
      action: 'device.register',
      method: 'POST',
      path: '/v1/devices',
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent'),
      statusCode: 201,
      metadata: { deviceId: device?.id },
    });

    return { data: device };
  }, {
    body: t.Object({
      branchId: t.String(),
      name: t.String(),
      type: t.String(),
    }),
    beforeHandle: [checkPermission('settings:manage')],
  })

  // Revoke device
  .patch('/:id/revoke', async ({ params: { id }, user, request }) => {
    if (!user?.tenantId) throw new Error('Tenant ID required');
    
    const device = await devicesService.revokeDevice(user.tenantId, id);

    await logAudit({
      tenantId: user.tenantId,
      userId: user.sub,
      action: 'device.revoke',
      method: 'PATCH',
      path: `/v1/devices/${id}/revoke`,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent'),
      statusCode: 200,
      metadata: { deviceId: device?.id },
    });

    return { data: device, message: 'Device revoked successfully' };
  }, {
    beforeHandle: [checkPermission('settings:manage')],
  })

  // Fast POS PIN authentication
  // Note: This endpoint does NOT require 'settings:manage' because any POS user can hit it from a paired device.
  // We'll require basic auth or a specific device token in a real production app, but for now we'll require an active staff session to 'switch' or just the device context.
  .post('/auth/pin', async ({ body, user, jwt }) => {
    // We assume the device is already sending its branchId context
    if (!user?.tenantId) throw new Error('Tenant context missing');

    const tokenPayload = await devicesService.authenticateWithPin(
      user.tenantId, 
      body.branchId, 
      body.userId, 
      body.pin
    );

    const token = await jwt.sign(tokenPayload);

    return {
      token,
      user: {
        id: tokenPayload.sub,
        role: tokenPayload.role,
        roleId: tokenPayload.roleId,
        tenantId: tokenPayload.tenantId,
      }
    };
  }, {
    body: t.Object({
      branchId: t.String(),
      userId: t.String(),
      pin: t.String(),
    }),
  });
