import { eq, and, gt, desc, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../db';
import { users, otpCodes, sessions, userRoleEnum, roles, rolePermissions, permissions, tenants, passwordResetTokens } from '../../db/schema';

export class AuthService {
  /**
   * Helper to load tenant branding info.
   */
  async getTenantDetails(tenantId: string | null) {
    if (!tenantId) return null;
    const tenantRecord = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });
    if (!tenantRecord) return null;
    return {
      id: tenantRecord.id,
      name: tenantRecord.name,
      logoUrl: tenantRecord.logoUrl,
      brandColor: tenantRecord.brandColor
    };
  }

  /**
   * Helper to load role info and permissions for RBAC context.
   */
  async getRoleDetails(roleSlug: string, tenantId: string | null) {
    let roleRecord = await db.query.roles.findFirst({
      where: and(
        eq(roles.slug, roleSlug),
        eq(roles.tenantId, tenantId as string)
      )
    });

    if (!roleRecord) {
      roleRecord = await db.query.roles.findFirst({
        where: and(
          eq(roles.slug, roleSlug),
          isNull(roles.tenantId)
        )
      });
    }

    if (!roleRecord) return undefined;

    const perms = await db
      .select({ slug: permissions.slug })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleRecord.id));

    return {
      id: roleRecord.id,
      name: roleRecord.name,
      slug: roleRecord.slug,
      isSystem: roleRecord.isSystem,
      permissions: perms.map(p => p.slug)
    };
  }

  /**
   * Traditional password-based login for staff and admins.
   */
  async loginWithPassword(email: string, pass: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await Bun.password.verify(pass, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const roleDetails = await this.getRoleDetails(user.role, user.tenantId);
    const tenantDetails = await this.getTenantDetails(user.tenantId);

    return {
      ...user,
      roleDetails,
      tenantDetails
    };
  }

  /**
   * Generates a 6-digit OTP and stores it in the database.
   */
  async sendOtp(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.insert(otpCodes).values({
      phone,
      code,
      expiresAt,
    });

    // In a real app, this is where we call MSG91 or Twilio API
    console.log(`[MOCK SMS] Sent OTP ${code} to ${phone}`);
    return code;
  }

  /**
   * Verifies the OTP, marks it used, and returns/creates the User.
   */
  async verifyOtp(phone: string, code: string) {
    // Find the latest active OTP for this phone
    const [otpRecord] = await db.select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.code, code),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otpRecord || otpRecord.usedAt) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark as used
    await db.update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, otpRecord.id));

    // Find user or create one (Customer by default)
    let [user] = await db.select().from(users).where(eq(users.phone, phone));

    if (!user) {
      const inserted = await db.insert(users).values({
        name: 'New User',
        phone,
        role: 'customer',
      }).returning();
      user = inserted[0];
    }
    
    if (!user) {
      throw new Error('Failed to create user record');
    }

    const roleDetails = await this.getRoleDetails(user.role, user.tenantId);
    const tenantDetails = await this.getTenantDetails(user.tenantId);

    return {
      ...user,
      roleDetails,
      tenantDetails
    };
  }

  /**
   * Creates a long-lived refresh token session in the DB.
   */
  async createSession(userId: string, deviceInfo: string): Promise<string> {
    const refreshToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      userId,
      refreshToken,
      deviceInfo,
      expiresAt,
    });

    return refreshToken;
  }

  /**
   * Validates a refresh token and returns the associated user.
   */
  async refreshSession(refreshToken: string) {
    const [sessionRecord] = await db.select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshToken, refreshToken),
          eq(sessions.isRevoked, false),
          gt(sessions.expiresAt, new Date())
        )
      );

    if (!sessionRecord) {
      throw new Error('Invalid or expired refresh token');
    }

    const [user] = await db.select().from(users).where(eq(users.id, sessionRecord.userId));
    if (!user) {
      throw new Error('User not found');
    }

    const roleDetails = await this.getRoleDetails(user.role, user.tenantId);
    const tenantDetails = await this.getTenantDetails(user.tenantId);

    return { 
      user: {
        ...user,
        roleDetails,
        tenantDetails
      }, 
      session: sessionRecord 
    };
  }

  /**
   * Generates a password reset token and "sends" an email.
   */
  async requestPasswordReset(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    // To prevent email enumeration, return immediately if user not found.
    // The API response will look exactly the same either way.
    if (!user) return;

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing tokens for this user to prevent spam
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Mock Email sending
    console.log(`\n[MOCK EMAIL] Password Reset requested for ${email}`);
    console.log(`[MOCK EMAIL] Link: http://localhost:5173/reset-password?token=${rawToken}\n`);
  }

  /**
   * Verifies the token and updates the user's password.
   */
  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const [tokenRecord] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));

    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await Bun.password.hash(newPassword);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, tokenRecord.userId));

    // Immediately invalidate the token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));
  }

  /**
   * Updates basic profile information.
   */
  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const [updatedUser] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
      
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }
}
