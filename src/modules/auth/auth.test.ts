import { describe, expect, it, beforeAll } from 'bun:test';
import { Elysia } from 'elysia';
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
});
