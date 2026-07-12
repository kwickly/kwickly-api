# Database Schema Standards & Architecture

As of July 12, 2026, Kwickly API strictly enforces the following database schema architecture across all domain modules using Drizzle ORM and PostgreSQL.

## 1. Global Soft-Deletes (Auditability)

> [!IMPORTANT]
> **No operational data is ever hard-deleted.**

For auditing purposes and to comply with standard SaaS best practices, all tables that store operational, transactional, or entity data must include a `deletedAt` timestamp column.

- **Implementation:** `deletedAt: timestamp('deleted_at')`
- **Behavior:** When a user "deletes" a record (e.g., a menu item, order, or staff profile), the API must update `deleted_at` with the current timestamp instead of executing a SQL `DELETE`.
- **Querying:** All `SELECT` queries across the API must explicitly filter for `where: isNull(table.deletedAt)` to ignore logically deleted records.

## 2. Multi-Tenant Indexing (`idxTenant`)

Kwickly is a multi-tenant platform. To prevent accidental full table scans and guarantee sub-millisecond query performance at scale, every table containing a `tenantId` MUST be indexed by that `tenantId`.

- **Implementation Requirement:**
  At the bottom of every schema file, inside the Drizzle table definition callback, ensure `idxTenant` is explicitly declared:
  ```typescript
  (table) => {
    return {
      idxTenant: index('idx_tableName_tenant_id').on(table.tenantId)
    };
  }
  ```

## 3. Tenant Lifecycle Management

Tenants in the Kwickly system do not use binary active/inactive flags. Tenant lifecycles are explicitly managed to handle business scenarios like non-payment, Terms of Service violations, and off-boarding.

- **`tenantStatusEnum`:** Replaces the legacy `isActive` boolean. Allowed values are `'ACTIVE'`, `'SUSPENDED'`, and `'TERMINATED'`.
- **Lifecycle Auditing:**
  - `suspendedAt: timestamp('suspended_at')`
  - `terminatedAt: timestamp('terminated_at')`
- **Access Control:** Suspension and termination are strictly restricted actions. Only users with the `platform_owner` system role are authorized to modify tenant status or lifecycle timestamps.

## 4. Resetting the Schema (Local Development)

If fundamental architectural columns are changed (e.g., dropping a boolean in favor of an enum), Drizzle ORM's CLI requires interactive TTY prompts which can disrupt automated pipelines.

If you encounter this and need to wipe your local schema to start fresh:
1. Ensure you are targeting the correct local/development database.
2. Run `db:push --force` to forcefully drop columns, OR write a custom script to execute `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.
3. Wipe the `drizzle/` migrations directory.
4. Run `db:generate` followed by `db:push`.
5. Run the comprehensive `src/db/seed.ts` script to generate 30+ mock users, POS orders, and stable tenant structures.
