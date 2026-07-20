import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`ALTER TABLE "orders" DROP COLUMN IF EXISTS "mode";`);
    await db.execute(sql`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_status";`);
    await db.execute(sql`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_method";`);
    await db.execute(sql`DROP TYPE IF EXISTS "public"."order_mode";`);
    console.log("Successfully cleaned up partial migration");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
