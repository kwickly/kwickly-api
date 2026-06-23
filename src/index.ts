import { sql } from 'drizzle-orm';
import { db } from './db/index.ts';
import { logger } from './shared/logger.ts';
import { app } from './server.ts';
import { eventBus, EVENTS } from './shared/events.ts';
import { payrollController } from './modules/payroll/payroll.controller.ts';

async function bootstrap() {
  try {
    logger.info('Verifying database connection...');
    
    // For both neon-http and postgres-js, we can execute a simple query
    await db.execute(sql`SELECT 1`);
    
    logger.info('Database connection verified successfully.');

    const port = process.env.PORT ?? 3000;
    app.listen(port);

    // Wire Event Bus to Bun WebSockets for zero-latency KDS Sync
    eventBus.on(EVENTS.NEW_KOT, (payload) => {
      const topic = `branch:${payload.branchId}:kots`;
      app.server?.publish(topic, JSON.stringify({
        type: 'NEW_KOT',
        data: payload
      }));
    });

    eventBus.on(EVENTS.KOT_UPDATED, (payload) => {
      const topic = `branch:${payload.branchId}:kots`;
      app.server?.publish(topic, JSON.stringify({
        type: 'KOT_UPDATED',
        data: payload
      }));
    });

    logger.info(`🦊 Kwickly API is running at ${app.server?.hostname}:${app.server?.port}`);

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();

// --- Graceful Shutdown ---
const shutdown = () => {
  logger.info('SIGINT/SIGTERM received. Shutting down gracefully...');
  
  if (app.server) {
    app.server.stop();
    logger.info('Server stopped accepting new connections.');
  }

  // E.g., close DB connections or redis connections here if needed
  // Since we use neon-http (stateless) and postgres-js (manages its own pool), 
  // explicit closing might not be strictly necessary for neon-http, 
  // but good practice for persistent ones.
  
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
