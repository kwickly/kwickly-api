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

  const items = await db.select().from(menuItems).where(eq(menuItems.tenantId, tenant.id)).limit(5);
  console.log("tenant.id:", tenant.id);
  console.log("Sample items:", items.map(i => ({ id: i.id, name: i.name, tenantId: i.tenantId })));
  process.exit(0);
}
run();
