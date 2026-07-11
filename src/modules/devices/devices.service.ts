import { db } from '../../db';
import { devices, users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomInt } from 'crypto';
import { hash, verify } from 'argon2';
import { jwt } from '@elysiajs/jwt';

export class DevicesService {
  /**
   * List all devices for a specific branch
   */
  async listDevices(tenantId: string, branchId: string) {
    return await db
      .select()
      .from(devices)
      .where(and(eq(devices.tenantId, tenantId), eq(devices.branchId, branchId)))
      .orderBy(desc(devices.createdAt));
  }

  /**
   * Register a new device and generate a pairing code
   */
  async registerDevice(data: { tenantId: string; branchId: string; name: string; type: 'POS' | 'KDS' }) {
    // Generate a 6-digit random code
    const pairingCode = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const [device] = await db
      .insert(devices)
      .values({
        ...data,
        pairingCode,
        pairingCodeExpiresAt: expiresAt,
        status: 'offline', // Starts offline until it authenticates
      })
      .returning();

    return device;
  }

  /**
   * Revoke a device
   */
  async revokeDevice(tenantId: string, id: string) {
    const [device] = await db
      .update(devices)
      .set({ status: 'revoked', pairingCode: null, pairingCodeExpiresAt: null, updatedAt: new Date() })
      .where(and(eq(devices.id, id), eq(devices.tenantId, tenantId)))
      .returning();

    if (!device) throw new Error('Device not found or not owned by tenant');
    return device;
  }

  /**
   * PIN Authentication for POS
   */
  async authenticateWithPin(tenantId: string, branchId: string, userId: string, pin: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId), eq(users.status, 'ACTIVE')));

    if (!user || !user.posPin) {
      throw new Error('Invalid user or PIN not set');
    }

    const isValid = await verify(user.posPin, pin);
    if (!isValid) {
      throw new Error('Invalid PIN');
    }

    // Assuming we'll return a payload to be signed by the controller
    return {
      sub: user.id,
      role: user.role,
      roleId: user.roleId,
      tenantId: user.tenantId,
      branchId,
    };
  }

  /**
   * Set or reset POS PIN for a user
   */
  async setPosPin(tenantId: string, userId: string, pin: string) {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    const hashedPin = await hash(pin);

    const [user] = await db
      .update(users)
      .set({ posPin: hashedPin, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .returning();

    if (!user) throw new Error('User not found');
    return user;
  }
}
