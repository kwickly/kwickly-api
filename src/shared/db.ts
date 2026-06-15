import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const isLocal = process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL?.includes('localhost');

// If using local Docker Postgres, we use standard Postgres driver
// If using Neon Serverless, we use the neon-http driver
export const db = isLocal
  ? drizzlePg(postgres(process.env.DATABASE_URL || ''), { schema })
  : drizzle(neon(process.env.DATABASE_URL || ''), { schema });

// Bun native SQL — for complex analytics queries and bulk operations
// Uses the pooled connection string to avoid exhausting NeonDB free-tier connections
export const rawSql = isLocal ? null : Bun.sql(process.env.DATABASE_POOLED_URL!);
