import { Elysia, t } from 'elysia';
import { WalletService } from './wallet.service.ts';
import { requireAuth } from '../auth/auth.guard.ts';
import { requirePermission } from '../auth/rbac.guard.ts';

export const walletController = new Elysia({ prefix: '/crm/wallet' })
  .decorate('walletService', new WalletService())
  .use(requireAuth)
  .use(requirePermission('wallet:manage')) // Ensure only authorized users can access this
  
  .post('/credit', async ({ walletService, body, user }) => {
    // Note: the `user.tenantId` is populated by the auth middleware
    const tenantId = user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized: Tenant ID missing');

    const result = await walletService.creditWallet(
      tenantId,
      body.userId,
      body.amount,
      body.reason,
      body.orderId
    );
    return { success: true, transaction: result };
  }, {
    body: t.Object({
      userId: t.String(),
      amount: t.Numeric(),
      reason: t.String(),
      orderId: t.Optional(t.String()),
    })
  })
  
  .post('/debit', async ({ walletService, body, user }) => {
    const tenantId = user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized: Tenant ID missing');

    const result = await walletService.debitWallet(
      tenantId,
      body.userId,
      body.amount,
      body.reason,
      body.orderId
    );
    return { success: true, transaction: result };
  }, {
    body: t.Object({
      userId: t.String(),
      amount: t.Numeric(),
      reason: t.String(),
      orderId: t.Optional(t.String()),
    })
  })

  .get('/:userId/history', async ({ walletService, params, user }) => {
    const tenantId = user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized: Tenant ID missing');

    const history = await walletService.getWalletHistory(tenantId, params.userId);
    return { success: true, history };
  });
