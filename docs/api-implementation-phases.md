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
    *   *Integrity:* Enforced composite primary keys (`role_permissions`) and unique indexes (`menu_categories`, `menu_items`) to prevent duplicate records.
*   [x] **Authentication Core:**
    *   `auth.service.ts`: OTP generation and verification logic + Password-based login for staff.
    *   `auth.controller.ts`: API endpoints for `/v1/auth/login`, `/v1/auth/send-otp`, `/v1/auth/verify-otp`, and `/v1/auth/refresh`.
    *   Implemented stateless JWTs (15 min) + Stateful Refresh Tokens (30 days).
*   [x] **Route Protection (Guards):**
    *   `auth.guard.ts`: Intercepts and validates JWTs (via headers or HttpOnly cookies) using Elysia `.derive()`.
    *   `rbac.guard.ts`: Role-Based Access Control middleware to protect sensitive endpoints (e.g., `requireRoles(['admin', 'manager'])`).
*   [x] **Caching Infrastructure:** Integrated native TCP Redis (`Bun.redis`) in `src/shared/redis.ts` utilizing a Cache-Aside pattern (replacing the legacy HTTP `@upstash/redis`).
*   [x] **Observability:**
    *   Structured JSON Logging via `pino` (`logger.ts`).
    *   Global `auditPlugin` (`audit.ts`) automatically tracking all mutating requests (POST/PUT/PATCH/DELETE) into the `audit_logs` table.
*   [x] **Production Security Hardening:**
    *   Global `onError` handling for standardized, sanitized JSON responses.
    *   Rate Limiting (`elysia-rate-limit`) to prevent abuse and brute-force attacks.
    *   Basic HTTP Security Headers (X-Frame-Options, X-XSS-Protection, Strict-Transport-Security).
    *   Graceful shutdowns trapping `SIGINT`/`SIGTERM` to safely terminate active DB transactions.

---

## ✅ Phase 2: Core Business Logic (COMPLETED)

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
*   [x] **Combos & Payments APIs (COMPLETED):**
    *   REST endpoints for combo creation and webhook handlers. (Schemas are done).

---

## ✅ Phase 3: Enterprise Schema Expansion (COMPLETED)

This phase upgraded the database architecture to support massive scaling and comprehensive Restaurant Operations, including HR, Inventory, CRM, and Promotions.

*   [x] **Database Schemas Migrated:** Drizzle schemas for CRM, HR, Inventory, and Promotions are fully built and indexed.
*   [x] **Promotions Module APIs (COMPLETED):** Predefined staff discounts and customer-entered coupons (`promotions.ts`).
*   [x] **CRM Module APIs (COMPLETED):** Customer marketing profiles and dual-entry loyalty points ledger (`crm.ts`).
*   [x] **Inventory Module APIs (COMPLETED):** Raw materials, recipes, and per-branch stock ledgers (`inventory.ts`).
*   [x] **Staff & Payroll Module APIs (COMPLETED):** Staff profiles, automated salary calculations, digital IDs, and payslips (`staff.ts`, `payroll.ts`).

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

---

## ✅ Phase 7: Comprehensive Creation Flows (COMPLETED)

This phase finalized the creation flows across the admin dashboard and backend API, resolving route collisions, securing endpoints, and rendering full data grids on the frontend.

*   [x] **Backend Security Hardening:** Restricted SaaS plan creation (`POST /v1/subscriptions/plans`) strictly to `super_admin` and `tenant_owner` roles.
*   [x] **Consolidation:** Removed redundant users controller file to resolve route collisions on `/v1/staff`.
*   [x] **Menus & Modifiers API Expansion:** Added `GET /v1/menus/addons` endpoint and service methods for listing modifier data grids.
*   [x] **SaaS Subscriptions & Combo Setup**: Wired up combos creation and subscription plan creation in the frontend.

---

## ✅ Phase 8: Advanced Operational Features Mocking (COMPLETED)

This phase added endpoints supporting the advanced capabilities introduced in the Web Admin dashboard.

*   [x] **CRM Controller Endpoints:** Mock logic for rules-based segmentation, WhatsApp campaigns, churn prevention lists, and loyalty config (`crm.controller.ts`).
*   [x] **Staff Operations:** Mock logic for timesheets / clock-in approvals and dynamic RBAC role builder (`staff.controller.ts`).
*   [x] **Analytics Intelligence:** Mock logic for AI-driven meal demand forecasting (Prophet) and combo bundle recommendations (`analytics.controller.ts`).

---

## 🚧 Phase 6: Infrastructure & Launch Readiness (PENDING)

This phase ensures the backend is fully decoupled from local development constraints and ready for edge deployment and team collaboration.

*   [ ] **Cloud Storage Integration (Media & Files):**
    *   Implement an S3/Cloudflare R2 storage module for handling multipart form uploads.
    *   Endpoints for uploading Menu Item Images, Branch Logos, and Staff Avatars.
*   [ ] **Deployment Containerization (Docker):**
    *   Create an optimized, multi-stage `Dockerfile` built for the `oven/bun` runtime.
    *   Configure `docker-compose.yml` for local orchestration if necessary.
*   [ ] **Automated CI/CD Pipelines:**
    *   Set up GitHub Actions (`.github/workflows/ci.yml`) to automatically run `bun install` and type-checking on every Pull Request.
*   [ ] **Automated Testing Suite:**
    *   Implement `bun:test` framework.
    *   Write End-to-End (E2E) tests for critical flows (e.g., OTP Verification, Order Placement).

---

## 🚧 Phase 7: Automated Testing (PENDING)

This phase ensures all endpoints are rigorously tested to prevent regressions.

*   [ ] Set up `bun:test` in `package.json`.
*   [ ] Write E2E integration tests for `auth.controller` (OTP, Login).
*   [ ] Write E2E integration tests for `orders.controller` (Order Placement, Cart calculation).
