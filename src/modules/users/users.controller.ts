import { Elysia, t } from 'elysia';
import { UsersService } from './users.service';
import { authPlugin } from '../auth/auth.guard';
import { loggerPlugin } from '../../shared/logger';

const usersService = new UsersService();

export const usersController = new Elysia({ prefix: '/v1/users' })
  .use(loggerPlugin)
  .use(authPlugin)
  
  // GET /v1/users/me
  // Strictly uses the JWT sub (user.id) and ignores impersonation headers
  .get('/me', async ({ user, set }) => {
    try {
      const profile = await usersService.getUserProfile(user.id);
      if (!profile) {
        set.status = 404;
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: profile };
    } catch (e: any) {
      set.status = 500;
      return { success: false, error: e.message };
    }
  })

  // PATCH /v1/users/me
  // Strictly uses the JWT sub (user.id) to prevent editing impersonated users
  .patch('/me', async ({ user, body, set }) => {
    try {
      const profile = await usersService.updateUserProfile(user.id, body);
      return { success: true, data: profile };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      avatarUrl: t.Optional(t.String()),
    })
  });
