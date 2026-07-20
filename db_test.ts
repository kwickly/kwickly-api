import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { menuItems } from "./src/db/schema/menus";
import { tenants } from "./src/db/schema/tenants";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/kwickly");
const db = drizzle(sql);

async function run() {
  const tenantSlug = "punjabi-chaska";
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
  if (!tenant) return process.exit(1);

  const items = await db.select().from(menuItems).where(eq(menuItems.tenantId, tenant.id));
  console.log("All items for tenant:", items.map(i => ({ id: i.id, name: i.name, status: i.status })));
  process.exit(0);
}
run();
