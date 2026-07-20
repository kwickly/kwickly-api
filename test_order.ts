import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { orders } from "./src/db/schema/orders";

const sql = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/kwickly");
const db = drizzle(sql);

async function run() {
  try {
    await db.insert(orders).values({
        tenantId: '2f9e5ddb-74e3-42cd-8633-3f5153cced11',
        branchId: 'default',
        type: 'paid',
        mode: 'dine_in',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: null as any,
        subtotal: '120',
        discountAmount: '0',
        total: '120',
        tableNumber: 'Table 12'
    });
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
