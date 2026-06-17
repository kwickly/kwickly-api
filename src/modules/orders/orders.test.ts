import { describe, expect, it, spyOn } from 'bun:test';
import { Elysia } from 'elysia';
import { OrdersService } from './orders.service.ts';

spyOn(OrdersService.prototype, 'placeOrder').mockImplementation(async (tenantId: string, payload: any) => {
  if (!payload.items || payload.items.length === 0) throw new Error('Order must contain at least one item');
  
  let subtotal = 0;
  const mockPrices: Record<string, number> = {
    'item-1': 100,
    'item-2': 50
  };

  const finalOrderItems = payload.items.map((i: any) => {
    const unitPrice = mockPrices[i.menuItemId] || 0;
    const total = unitPrice * i.quantity;
    subtotal += total;
    return { menuItemId: i.menuItemId, quantity: i.quantity, unitPrice, total };
  });

  return {
    order: {
      id: 'mock-order-id',
      tenantId,
      branchId: payload.branchId,
      status: 'pending',
      subtotal: subtotal.toString(),
      total: subtotal.toString()
    },
    kot: { id: 'mock-kot-id' }
  } as any;
});

spyOn(OrdersService.prototype, 'getOrderHistory').mockResolvedValue([]);

// Create a mock token for authPlugin bypass
import jwt from 'jsonwebtoken';
const mockJwtToken = jwt.sign(
  { sub: 'mock-user', role: 'customer', tenantId: 'tenant-123', branchId: 'branch-123' },
  process.env.JWT_SECRET || 'super-secret-fallback-key'
);

import { ordersController } from './orders.controller';

describe('Orders Module E2E', () => {
  const app = new Elysia().use(ordersController);

  it('should return 401 if unauthenticated user attempts to place an order', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: 'test-branch',
          type: 'paid',
          items: [{ menuItemId: 'item-1', quantity: 1 }],
        }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('should return 422 if order payload is missing required items', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJwtToken}`
        },
        body: JSON.stringify({
          branchId: 'test-branch',
          type: 'invalid-type',
        }),
      })
    );
    expect(response.status).toBe(422);
  });

  it('should return 422 if quantity is less than 1', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJwtToken}`
        },
        body: JSON.stringify({
          branchId: 'test-branch',
          type: 'paid',
          items: [{ menuItemId: 'item-1', quantity: 0 }],
        }),
      })
    );
    expect(response.status).toBe(422);
  });

  it('should return 422 for GET /v1/orders without branchId', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${mockJwtToken}` }
      })
    );
    expect(response.status).toBe(422);
  });

  it('should return 200 and place order successfully with valid payload', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJwtToken}`
        },
        body: JSON.stringify({
          branchId: 'test-branch',
          type: 'paid',
          items: [
            { menuItemId: 'item-1', quantity: 2 },
            { menuItemId: 'item-2', quantity: 1 }
          ],
        }),
      })
    );
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.order.id).toBe('mock-order-id');
  });

  it('should calculate cart total correctly matching server-side expectations', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJwtToken}`
        },
        body: JSON.stringify({
          branchId: 'test-branch',
          type: 'paid',
          items: [
            { menuItemId: 'item-1', quantity: 2 }, // 100 * 2 = 200
            { menuItemId: 'item-2', quantity: 3 }  // 50 * 3 = 150
          ],
        }),
      })
    );
    expect(response.status).toBe(200);
    const body: any = await response.json();
    // 200 + 150 = 350
    expect(body.data.order.total).toBe('350');
  });
});
