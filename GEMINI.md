# Kwickly API - Agent Instructions (GEMINI.md)

Welcome! If you are an AI agent assisting with the Kwickly API, you must adhere to the strict architectural guidelines established in this document to maintain consistency, security, and performance.

## 1. Tech Stack Overview
- **Runtime:** Bun
- **Framework:** ElysiaJS
- **ORM:** Drizzle ORM
- **Primary Database:** PostgreSQL (Neon Serverless)
- **Cache:** TCP Redis (via native `Bun.redis`)

## 2. Strict Database Rules
Failure to follow these rules will compromise the system's data integrity.
- **IDs:** Always use native PostgreSQL `uuid` data types with `.defaultRandom()`. Never use numeric auto-increment or string-based IDs.
- **Deletions:** **Hard deletes are forbidden for critical business data.** You must use Soft Deletes by adding a `deletedAt` timestamp column.
- **Cascades:** Never use `onDelete: 'cascade'` in foreign keys. We enforce relational integrity at the application layer or use `RESTRICT` to prevent accidental massive data loss.
- **Migrations:** All production migrations must be additive (Zero-Downtime Rule). Never run `ALTER TABLE ... RENAME COLUMN` in a single deployment. Use the Expand & Contract pattern.

## 3. Architecture & Code Guidelines
- **TypeScript Imports:** We use `"type": "module"`. When importing local files inside `src/`, you **must explicitly append the `.ts` extension** (e.g., `import { users } from './users.ts';`) to avoid module resolution errors.
- **Elysia Context:** Use Elysia's `.derive()` to inject data into the context (e.g., Auth Guards parsing JWTs and injecting the `user` object).
- **Caching:** Use the `withCache` helper in `src/shared/redis.ts` to wrap read-heavy, rarely-changing queries (like fetching the restaurant menu or branch config).
- **Audit Logging:** The global `auditPlugin` in `src/shared/audit.ts` automatically logs all mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`). You do not need to manually log these actions in your controllers.
- **Temporary Scripts:** All temporary/scratch scripts, testing helpers, or query scripts (like `check.ts` or `test_svc.ts`) must be created under a `scripts/` folder at the root. The `scripts/` folder is git-ignored and must never be tracked or pushed to the git repository.

## 4. Local Development vs Production
- **Local Database:** When `.env` contains `localhost` in the `DATABASE_URL`, `src/shared/db.ts` automatically switches to the standard `postgres` driver to support local Docker instances.
- **Production Database:** Uses `@neondatabase/serverless` HTTP driver to bypass TCP connection limits.
- **Commands:**
  - `bun run dev` (Starts Elysia server)
  - `bun run db:push` (Pushes local schema changes directly to DB - **Dev Only**)
  - `bun run db:generate` (Generates safe SQL migration files for Production)
  - `bun run db:migrate` (Applies generated migrations to the database)
  - `bun run db:local:migrate` (Applies migrations to local PostgreSQL)
  - `bun run db:prod:migrate` (Applies migrations to production NeonDB)
  - `bun run db:seed` (Populates the database with initial seed data)
  - `bunx tsc --noEmit` (Strict type checking)
