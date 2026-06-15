import { Elysia } from 'elysia';
import { db } from '../db';
import { auditLogs } from '../db/schema/auditLogs';

/**
 * Global Audit Middleware
 * Intercepts all requests. If the request is mutating (POST, PUT, PATCH, DELETE)
 * AND the user is authenticated, it asynchronously records the action to the database.
 */
export const auditPlugin = (app: Elysia) => app
  .onAfterHandle({ as: 'global' }, async ({ request, body, user }: any) => {
    const method = request.method.toUpperCase();

    // We strictly ignore GET, OPTIONS, HEAD as they do not mutate data
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return;
    }

    // We need an authenticated user to audit who did it
    // If user is not present (e.g., login route), we might skip or handle differently
    if (!user || !user.sub || !user.tenantId) {
      return;
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Remove sensitive fields from payload before logging (like passwords, CVVs)
    const safePayload = { ...((body as any) || {}) };
    if (safePayload.password) delete safePayload.password;
    if (safePayload.code) delete safePayload.code; // e.g., OTP codes

    // Extract IP (Elysia doesn't natively parse it from headers easily without a plugin, 
    // but typically it's in X-Forwarded-For)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Fire and forget the database insert (do not await, so we don't slow down the user's response)
    db.insert(auditLogs).values({
      tenantId: user.tenantId,
      userId: user.sub,
      method,
      path,
      payload: Object.keys(safePayload).length > 0 ? safePayload : null,
      ipAddress,
    }).catch(err => {
      console.error('[Audit Log Error]: Failed to save audit log', err);
    });
  });
