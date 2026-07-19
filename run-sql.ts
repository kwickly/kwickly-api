import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
dotenv.config();
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function run() {
  try {
    const query = readFileSync('./drizzle/migrations/0003_menu_item_enrichment_tags_nutrition_availability.sql', 'utf8');
    // Split by statement-breakpoint
    const statements = query.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      console.log('Running:', stmt);
      await sql.unsafe(stmt);
    }
    console.log('All statements executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
run();
