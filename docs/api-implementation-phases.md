# Kwickly API: Phase-Wise Implementation Strategy & Tracker

This document serves as the master tracking sheet for the `kwickly-api` backend repository. It outlines what has been fully implemented, what is currently in the pipeline, and what is planned for the future.

This file provides critical context retrieval for any developer or AI agent joining the project.

---

## ✅ Phase 1: Foundation & Security (COMPLETED)

This phase established the bedrock of the API, ensuring it is secure, fast, and multi-tenant capable.

*   [x] **Framework Setup:** Initialized Bun + ElysiaJS backend with automatic hot-reloading.
*   [x] **Database Connectivity:** Configured `src/shared/db.ts` to seamlessly support both local Docker (PostgreSQL TCP) and production Neon Serverless (HTTP).
*   [x] **Drizzle Schemas:** Defined all core tables using strict native UUIDs and Soft Deletes (`deletedAt`).
    *   *Tables:* `tenants`, `users`, `branches`, `menus`, `orders`, `kots`, `payments`, `sessions`, `auditLogs`.
*   [x] **Authentication Core:**
    *   `auth.service.ts`: OTP generation and verification logic.
    *   `auth.controller.ts`: API endpoints for `/send-otp`, `/verify-otp`, and `/refresh`.
    *   Implemented stateless JWTs (15 min) + Stateful Refresh Tokens (30 days).
*   [x] **Route Protection (Guards):**
    *   `auth.guard.ts`: Intercepts and validates JWTs (via headers or HttpOnly cookies) using Elysia `.derive()`.
    *   `rbac.guard.ts`: Role-Based Access Control middleware to protect sensitive endpoints (e.g., `requireRoles(['admin', 'manager'])`).
*   [x] **Caching Infrastructure:** Integrated `@upstash/redis` in `src/shared/redis.ts` utilizing a Cache-Aside pattern.
*   [x] **Observability:**
    *   Structured JSON Logging via `pino` (`logger.ts`).
    *   Global `auditPlugin` (`audit.ts`) automatically tracking all mutating requests (POST/PUT/PATCH/DELETE) into the `audit_logs` table.

---

## 🚧 Phase 2: Core Business Logic (PARTIAL)

This phase focused on the primary RESTful endpoints required for the Web Dashboard and Customer App to function.

*   [x] **Tenant & Branch Management:**
    *   `GET /api/v1/branches`: List branches for a tenant.
    *   `POST /api/v1/branches`: Create a new branch.
    *   `PATCH /api/v1/branches/:id`: Update branch config (requires cache invalidation).
*   [x] **Menu Management:**
    *   `GET /api/v1/menus/:branchId`: Fetch full menu (Aggressively cached via Redis).
    *   `POST /api/v1/menus/items`: Add items/categories.
*   [x] **Subscriptions & QR Attendance APIs (COMPLETED):**
    *   REST endpoints for buying plans and scanning QR codes. (Schemas are done).
*   [ ] **Combos & Payments APIs (PENDING):**
    *   REST endpoints for combo creation and webhook handlers. (Schemas are done).

---

## 🚧 Phase 3: Enterprise Schema Expansion (PARTIAL)

This phase upgraded the database architecture to support massive scaling and comprehensive Restaurant Operations, including HR, Inventory, CRM, and Promotions.

*   [x] **Database Schemas Migrated:** Drizzle schemas for CRM, HR, Inventory, and Promotions are fully built and indexed.
*   [ ] **Promotions Module APIs (PENDING):** Predefined staff discounts and customer-entered coupons (`promotions.ts`).
*   [ ] **CRM Module APIs (PENDING):** Customer marketing profiles and dual-entry loyalty points ledger (`crm.ts`).
*   [ ] **Inventory Module APIs (PENDING):** Raw materials, recipes, and per-branch stock ledgers (`inventory.ts`).
*   [ ] **HR & Payroll Module APIs (PENDING):** Staff profiles, automated salary calculations, digital IDs, and payslips (`hr.ts`).

---

## ✅ Phase 4: Ordering & KOT Engine (COMPLETED)

This phase handles the complex transactional logic of placing orders and syncing them with the kitchen.

*   [x] **Order Placement:**
    *   `POST /api/v1/orders`: Calculate totals, taxes, and insert order using strict server-side pricing.
    *   *ACID Transactions* implemented to prevent corrupted states.
*   [x] **KOT Synchronization (Kitchen Display):**
    *   Generate KOTs linked to orders.
    *   Status transition logic (Pending -> Preparing -> Ready -> Completed).
    *   Bun Native WebSockets implemented for real-time kitchen tablet updates.
*   [x] **Payment Integration:**
    *   Basic order statuses configured for future webhook listeners.

---

## ✅ Phase 5: Analytics & Integrations (COMPLETED)

This phase adds advanced capabilities like reporting dashboards, background jobs, and hardware integrations.

*   [x] **Analytics Dashboards:**
    *   Use raw `Bun.sql` or Drizzle raw queries for high-performance aggregations (e.g., daily sales, top items).
*   [x] **Hardware Integration:**
    *   Endpoints for Thermal Printer (ESC/POS) integration.
*   [x] **Background Jobs:**
    *   Set up Trigger.dev for cron jobs (End-of-day reports, inventory low-stock alerts, etc).
