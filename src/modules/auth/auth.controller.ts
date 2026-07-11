import { Elysia, t } from 'elysia';
import { AuthService } from './auth.service';
import { authPlugin } from './auth.guard';
import { loggerPlugin } from '../../shared/logger';
import { db } from '../../db';
import { tenants, tenantBrandings } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

const authService = new AuthService();

export const authController = new Elysia({ prefix: '/v1/auth' })
  .use(loggerPlugin)
  .use(authPlugin)
  
  // 0. Fetch Public Branding by Hostname
  .get('/branding', async ({ query }) => {
    try {
      const hostname = query.hostname as string;
      if (!hostname) {
        return { success: false, error: 'Hostname required' };
      }
      
      let slug = hostname;
      // Handle kwickly subdomains (e.g., brand.kwickly.com -> brand)
      if (hostname.includes('kwickly.com') || hostname.includes('localhost')) {
        slug = hostname.split('.')[0];
      }

      const tenantResult = await db.select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        brandColor: tenantBrandings.brandColor,
        logoUrl: tenantBrandings.logoUrl,
        logoDarkUrl: tenantBrandings.logoDarkUrl,
        hideKwicklyBranding: tenantBrandings.hideKwicklyBranding,
        themeMode: tenantBrandings.themeMode
      })
      .from(tenants)
      .leftJoin(tenantBrandings, eq(tenants.id, tenantBrandings.tenantId))
      .where(or(
        eq(tenants.slug, slug),
        eq(tenantBrandings.customDomain, hostname)
      ))
      .limit(1);

      if (tenantResult.length === 0) {
        // Return default kwickly branding
        return { success: true, branding: null };
      }
      return { success: true, branding: tenantResult[0] };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    query: t.Object({ hostname: t.String() })
  })

  // 1. Request OTP
  .post('/send-otp', async ({ body, log }) => {
    const code = await authService.sendOtp(body.phone);
    log.info({ phone: body.phone }, 'OTP Requested');
    return { success: true, message: 'OTP sent successfully (Check server logs in dev mode)' };
  }, {
    body: t.Object({ phone: t.String() })
  })

  // 1.1 Password Login (For Staff/Admin)
  .post('/login', async ({ body, jwt, cookie, set, headers }) => {
    try {
      const user = await authService.loginWithPassword(body.email, body.password);
      const deviceInfo = headers['user-agent'] || 'Unknown Device';
      
      const refreshToken = await authService.createSession(user.id, deviceInfo);
      
      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        roleId: (user as any).roleId || null,
        tenantId: user.tenantId,
        branchId: user.branchId,
      });

      cookie.auth_session.set({
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          roleDetails: (user as any).roleDetails,
          tenantDetails: (user as any).tenantDetails,
        }
      };
    } catch (e: any) {
      set.status = 401;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // 2. Verify OTP & Login
  .post('/verify-otp', async ({ body, jwt, cookie, set, headers }) => {
    try {
      const user = await authService.verifyOtp(body.phone, body.code);
      const deviceInfo = headers['user-agent'] || 'Unknown Device';
      
      const refreshToken = await authService.createSession(user.id, deviceInfo);
      
      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        roleId: (user as any).roleId || null,
        tenantId: user.tenantId,
        branchId: user.branchId,
      });

      // Set cookie for web apps safely
      cookie.auth_session.set({
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 // 15 mins
      });

      return {
        success: true,
        accessToken,
        refreshToken, // Mobile apps will store this securely
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          roleDetails: (user as any).roleDetails,
          tenantDetails: (user as any).tenantDetails,
        }
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      phone: t.String(),
      code: t.String()
    })
  })

  // 3. Refresh Token
  .post('/refresh', async ({ body, jwt, cookie, set }) => {
    try {
      const { user } = await authService.refreshSession(body.refreshToken);
      
      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        roleId: (user as any).roleId || null,
        tenantId: user.tenantId,
        branchId: user.branchId,
      });

      // Update cookie safely
      cookie.auth_session.set({
        value: accessToken,
        maxAge: 15 * 60
      });

      return { success: true, accessToken };
    } catch (e: any) {
      set.status = 401;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({ refreshToken: t.String() })
  })

  // 4. Logout
  .post('/logout', async ({ cookie }) => {
    cookie.auth_session.remove();
    return { success: true, message: 'Logged out successfully' };
  })

  // 5. Forgot Password
  .post('/forgot-password', async ({ body }) => {
    await authService.requestPasswordReset(body.email);
    // Always return success to prevent email enumeration
    return { success: true, message: 'If an account exists, a reset link has been sent to that email.' };
  }, {
    body: t.Object({ email: t.String() })
  })

  // 6. Reset Password
  .post('/reset-password', async ({ body, set }) => {
    try {
      await authService.resetPassword(body.token, body.newPassword);
      return { success: true, message: 'Password has been reset successfully. You can now login.' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      token: t.String(),
      newPassword: t.String()
    })
  })
  
  // 7. Update Profile (Protected)
  .use(authPlugin)
  .patch('/profile', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const updatedUser = await authService.updateProfile(user.sub, {
        name: body.name,
        phone: body.phone
      });
      return { success: true, user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone
      } };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String())
    })
  });
