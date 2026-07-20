# Kwickly Platform — Master Progress Tracker

**Last Updated:** 2026-07-19  
**Source of Truth Repo:** kwickly-api (mirrored to admin-web and client)

> This document is the canonical progress tracker for the entire Kwickly platform.  
> Update it every time a phase is completed or a new epic begins.  
> Mirrors exist in `kwickly-admin-web/docs/` and `kwickly-client/docs/`.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Completed & deployed |
| 🟡 | In progress / partial |
| 🔴 | Planned — not started |
| ⏸️ | Paused / deferred |

---

## Completed Phases

### ✅ Phase 0 — Foundation
- Multi-repo setup (kwickly-api, kwickly-admin-web, kwickly-client)
- Neon PostgreSQL + Drizzle ORM integration
- ElysiaJS API framework with JWT auth
- RBAC with custom roles and granular permissions
- Audit log interceptors on all mutations

### ✅ Phase 1 — Menu System & Catalog Management
- Menu items, categories, modifiers, options
- Menu item enrichment: veg/jain/gluten-free flags, spice level, nutrition info, tags
- Live WebSocket sync to POS

### ✅ Phase 2 — Inventory Tracking & Supply Chain
- Real-time inventory levels and low-stock thresholds
- Supplier management
- Recipe/ingredient mapping

### ✅ Phase 3 — Staff, Timesheets & Payroll
- POS PIN-based clock-in/out
- Shift scheduling
- Automated wage and payroll generation
- Leave management and public holidays

### ✅ Phase 4 — CRM, Wallet & Offline Subscriptions
- Customer directory with offline POS registration
- Wallet / loyalty points system
- Subscription plans (offline cash-based)
- Campaign logs

### ✅ Phase 5 — Wildcard Subdomain Storefront
- Removed `[tenantSlug]` path-based routing from kwickly-client
- `(storefront)` route group reads tenant from HTTP host header
- Each tenant gets `tenant.kwickly.in`
- No middleware, no separate deployments

### ✅ Phase 6 — KDS Kanban Redesign
- Replaced static KDS with drag-and-drop Kanban board (`@dnd-kit/core`)
- Text-dense, image-free ticket design for kitchen staff
- Wait-time urgency badges (pulsing red >20 min)
- Forward-only state transition enforcement
- WebSocket real-time push to KDS

### ✅ Phase 7 — ETA & Kitchen Prep Time
- `defaultPreparationTime` column on `tenants` table
- `estimatedCompletionTime` calculated in `getPublicOrderStatus`
- Kitchen Settings card in `OperationalSettings.tsx`
- Live countdown on client order tracking page (SSE)

### ✅ Phase 8 — Theme & Font System
- Dual-font system: `Plus Jakarta Sans` (headings) / `Inter` (body)
- Semantic Tailwind CSS tokens (`bg-muted`, `border-border`, etc.)
- 60-30-10 color rule enforced across all pages
- Brand color injected into `--primary` CSS var at runtime

---

## In-Progress / Upcoming Phases

### 🔴 Phase 9 — Table Management & QR Codes

**Goal:** Full restaurant floor management with plan-gated table limits, QR-based table identification, and consolidated dine-in billing.

**Repos affected:** kwickly-api · kwickly-admin-web · kwickly-client

#### Sub-tasks:

**kwickly-api**
- [ ] New schema: `restaurant_tables` (id, branchId, name, capacity, status, qrToken, sortOrder)
- [ ] New schema: `table_sessions` (id, tableId, orderId, kotRound, status, openedAt, closedAt)
- [ ] Modify `kots`: add `kotRound`, `tableSessionId`
- [ ] Modify `orders`: add `tableId`, `sessionId`
- [ ] Modify `orderItems`: add `fulfillmentMode` (dine_in, takeaway)
- [ ] Modify `tenants`: add `maxTables` (plan-gated) and `allowTakeawayOnDineIn` (boolean)
- [ ] Run drizzle migration
- [ ] New module: `src/modules/tables/` (CRUD + regenerate-qr + close-session endpoints)
- [ ] Modify `placeOrder()`: resolve qrToken → session check → append or new order
- [ ] New method: `addItemsToOrder(sessionId, items[])` — append-only, new KOT round

**kwickly-admin-web**
- [ ] New page: `src/pages/tables/FloorView.tsx` (visual grid, live status, close-session)
- [ ] New page: `src/pages/tables/QRManager.tsx` (bulk download, print sheet, regenerate)
- [ ] Register routes in `App.tsx`
- [ ] Add "Tables & Floor" nav group to `AppSidebar.tsx`
- [ ] Modify `Kds.tsx`: show KOT round badge, table name from registry
- [ ] Show table count vs plan limit in `OperationalSettings.tsx`

**kwickly-client**
- [ ] Read `?t={qrToken}` from URL in `MenuClientView.tsx`
- [ ] Resolve token → table name via API
- [ ] Show "Dine-In · Table X" sticky banner
- [ ] Modify `checkout/page.tsx`: check active session → add-items vs new-order flow
- [ ] Fix hardcoded `tableNumber: 'Table 12'` bug in checkout
- [ ] Modify `orders/[orderId]/page.tsx`: group items by KOT round

---

### 🔴 Phase 10 — Online Payments (Razorpay)
- Wire checkout to Razorpay orders API
- Webhook handler on kwickly-api for `payment.captured`
- Mark orders as `paid` on success

### 🔴 Phase 11 — Advanced Analytics Dashboard
- Daily/weekly revenue trend charts
- Top-selling items breakdown
- Staff performance metrics
- Inventory forecast integration

### 🔴 Phase 12 — PWA & Push Notifications
- Dynamic `/manifest.json` per tenant
- Web Push via service workers
- Order-ready push notification to customer

### 🔴 Phase 13 — Customer-Facing Mobile App
- React Native port of `kwickly-client` storefront
- Deep-link QR code support
- Biometric login

---

## Known Bugs / Tech Debt

| # | Severity | Repo | Description | Status |
|---|---|---|---|---|
| 1 | 🔴 High | kwickly-client | `checkout/page.tsx` hardcodes `tableNumber: 'Table 12'` for every order | 🔴 Fix in Phase 9 |
| 2 | 🔴 High | kwickly-api | `updateOrderItems()` is destructive (DELETE + INSERT). Must become append-only | 🔴 Fix in Phase 9 |
| 3 | 🟡 Medium | kwickly-api | Every public order creates a new `orders` row. No session concept for dine-in | 🔴 Fix in Phase 9 |
| 4 | 🟡 Medium | kwickly-admin-web | `CreateMenuItemSheet.tsx` has Resolver type mismatch (pre-existing) | ⏸️ Deferred |
| 5 | 🟡 Medium | kwickly-admin-web | `PlatformTenants.tsx` plan enum mismatch (BASIC/CUSTOM not in type) | ⏸️ Deferred |
| 6 | 🟢 Low | kwickly-api | `POST /public/:slug` resolves `branchId='default'` but doesn't validate mode | 🔴 Fix in Phase 9 |
