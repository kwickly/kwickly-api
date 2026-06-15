import { Elysia, t } from 'elysia';
import { authPlugin } from '../auth/auth.guard';
import { requireRoles } from '../auth/rbac.guard';
import { UsersService } from './users.service';

const usersService = new UsersService();

/**
 * Staff (Users) Controller
 * Provides RESTful endpoints for managing restaurant employees.
 * Base Path: /v1/staff
 */
export const usersController = new Elysia({ prefix: '/v1/staff' })
  .use(authPlugin)

  .use(requireRoles(['admin', 'manager']))

  /**
   * GET /v1/staff
   * Retrieves all staff members (managers, cashiers, chefs) for the restaurant.
   * Restricted to Admins and Managers.
   */
  .get('/', async ({ user }) => {
    const data = await usersService.listStaff(user!.tenantId!);
    return { success: true, data };
  })

  /**
   * POST /v1/staff
   * Onboards a new staff member into the system. 
   * Restricted to Admins and Managers. Validates allowed roles via TypeBox.
   */
  .post('/', async ({ body, user }) => {
    const data = await usersService.createStaff(user!.tenantId!, {
      name: body.name,
      phone: body.phone,
      role: body.role as any,
      branchId: body.branchId,
    });
    return { success: true, data, message: 'Staff member onboarded successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      phone: t.String(),
      role: t.Union([
        t.Literal('manager'),
        t.Literal('cashier'),
        t.Literal('kitchen_staff'),
        t.Literal('qr_scanner')
      ]),
      branchId: t.Optional(t.String()),
    })
  });
