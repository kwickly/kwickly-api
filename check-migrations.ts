import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);
sql`SELECT * FROM drizzle.__drizzle_migrations`.then(rows => {
  console.log('MIGRATIONS:', rows);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
