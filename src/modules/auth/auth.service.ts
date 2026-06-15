import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from '../../db';
import { users, otpCodes, sessions, userRoleEnum } from '../../db/schema';

export class AuthService {
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

    return user;
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

    return { user, session: sessionRecord };
  }
}
