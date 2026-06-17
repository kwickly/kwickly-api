import { describe, expect, it, spyOn, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { AuthService } from './auth.service';

spyOn(AuthService.prototype, 'sendOtp').mockResolvedValue('123456');
spyOn(AuthService.prototype, 'verifyOtp').mockImplementation(async (phone: string, code: string) => {
  if (code !== '123456') throw new Error('Invalid OTP');
  return { id: 'mock-user-id', role: 'customer', name: 'Test User' } as any;
});
spyOn(AuthService.prototype, 'loginWithPassword').mockImplementation(async (email: string, pass: string) => {
  if (email === 'wrong@example.com') throw new Error('Invalid email or password');
  return { id: 'mock-staff', role: 'admin', name: 'Admin Staff' } as any;
});
spyOn(AuthService.prototype, 'createSession').mockResolvedValue('mock-refresh-token');
spyOn(AuthService.prototype, 'refreshSession').mockResolvedValue({ user: { id: 'mock-user-id', role: 'customer' } as any, session: {} as any });

import { authController } from './auth.controller';

describe('Auth Module', () => {
  const app = new Elysia().use(authController);

  it('should return 422 if phone is missing in send-otp', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(422);
  });

  it('should return 200 and success message for valid send-otp', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1234567890' }),
      })
    );
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('OTP sent successfully');
  });

  it('should return 200, access token, and user data for successful verify-otp', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1234567890', code: '123456' }),
      })
    );
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBe('mock-refresh-token');
    expect(body.user.id).toBe('mock-user-id');
  });

  it('should return 401 for invalid login credentials', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('should return 200, access token, and user data for successful login', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'correctpassword',
        }),
      })
    );
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBe('mock-refresh-token');
    expect(body.user.role).toBe('admin');
  });
});
