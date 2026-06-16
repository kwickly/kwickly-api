import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

// Default to DATABASE_URL (Local), but switch to DATABASE_POOLED_URL if DB_TARGET=prod
const dbUrl = process.env.DB_TARGET === 'prod' 
  ? process.env.DATABASE_POOLED_URL 
  : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(`Database URL not found for target: ${process.env.DB_TARGET || 'local'}`);
}

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
