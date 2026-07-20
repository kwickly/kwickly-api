import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`CREATE TYPE "public"."order_mode" AS ENUM('dine_in', 'takeaway', 'delivery');`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN "mode" "order_mode" DEFAULT 'dine_in' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'pending' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method";`);
    
    // Insert dummy record to mark the migration as complete in __drizzle_migrations
    console.log("Migrations applied manually!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
