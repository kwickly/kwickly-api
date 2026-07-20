import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/db';
import postgres from 'postgres';

async function main() {
  try {
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const migrationDb = drizzle(migrationClient);
    
    await migrate(migrationDb, { migrationsFolder: './drizzle/migrations' });
    console.log("Migrations applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
