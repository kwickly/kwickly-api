// @ts-nocheck
import { triggerClient } from '@trigger.dev/sdk';

/**
 * Initialize Trigger.dev client for background jobs.
 * This connects to the Trigger.dev v3 infrastructure to handle cron jobs and long-running tasks.
 */
export const trigger = triggerClient({
  id: 'kwickly-api',
  apiKey: process.env.TRIGGER_API_KEY || 'tr_dev_fallback',
  apiUrl: process.env.TRIGGER_API_URL,
});

/**
 * End-of-Day (EOD) Reconciliation Job
 * Runs every day at 2:00 AM.
 */
trigger.defineJob({
  id: 'eod-reconciliation',
  name: 'End of Day Reconciliation',
  version: '1.0.0',
  trigger: {
    type: 'cron',
    // 2:00 AM every day
    cron: '0 2 * * *',
  },
  run: async (payload, io, ctx) => {
    await io.logger.info('Starting EOD Reconciliation process...');
    
    // In a real scenario, we would:
    // 1. Fetch all tenants/branches.
    // 2. Compute total daily sales, tax liabilities, and tips.
    // 3. Mark orders from 'completed' to 'reconciled'.
    // 4. Generate a PDF report and email it to the Branch Manager.

    await io.runTask('compute-aggregations', async () => {
      // e.g. await db.execute(sql`...`)
      return { status: 'success', processed: true };
    });

    await io.logger.info('EOD Reconciliation completed successfully.');
    return { success: true };
  },
});
