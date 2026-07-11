import {
  uuid,
  pgTable, text, timestamp, boolean , index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── OTP Store ──────────────────────────────────────────────────────────────
// Stores one-time passwords for phone/email OTP login
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone:     text('phone'),
  email:     text('email'),
  code:      text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Refresh Token Sessions ──────────────────────────────────────────────────
// Tracks active refresh tokens per device for session revocation
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').notNull().references(() => users.id),
  refreshToken: text('refresh_token').notNull().unique(),
  deviceId:     uuid('device_id'), // UUID assigned to device on first install
  deviceInfo:   text('device_info'), // e.g. "iPhone 15 / iOS 18"
  isRevoked:    boolean('is_revoked').default(false).notNull(),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type OtpCode   = typeof otpCodes.$inferSelect;
export type Session   = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
