# Kwickly: Analytics, Notifications, and Multi-Tier Caching Architecture

**Date:** 2026-07-16
**Status:** Implemented (Analytics & Push Notifications), Executing (Caching Strategy)

## 1. Advanced Analytics (Platform-M6)
The Kwickly platform now features robust AI-driven analytics for franchise managers.
- **Staff Analytics:** Tracks order processing times, revenue generated per staff member, and efficiency metrics. The schema tracks `staffId` per order.
- **Inventory Forecasting:** An automated background job (`inventory-alert.job.ts`) using Trigger.dev runs nightly at 2:00 AM. It analyzes stock depletion rates and alerts branch managers if critical items have less than 3 days of stock remaining.
- **Frontend Integration:** Both features have dedicated rich-UI pages in `kwickly-admin-web` powered by Recharts and `@tanstack/react-query`.

## 2. PWA & Push Notifications (Platform-M9)
Kwickly applications (`kwickly-client` and `kwickly-admin-web`) are fully configured Progressive Web Apps (PWAs).
- **Backend Architecture:** Utilizes the Firebase Admin SDK to securely dispatch cross-platform messages. Device tokens are stored in the `fcm_tokens` Postgres table.
- **Decoupled Queues:** Notification dispatch is handled by Trigger.dev V3 queues (`send-push.job.ts`) with automatic retries (maxAttempts: 3), ensuring API threads are never blocked by network latency.
- **Client Service Workers:** Standardized `firebase-messaging-sw.js` files are placed in both frontend repositories to handle silent background notifications.

## 3. Caching Strategy (In Progress)
To maintain ultra-fast performance across thousands of tenants, Kwickly implements an industry-standard multi-tier caching strategy.

### 3.1 Backend Caching (`kwickly-api`)
- **Engine:** Native `Bun.redis` (TCP connections).
- **Pattern:** Cache-Aside with Stale-While-Revalidate (SWR).
- **Behavior:** High-read endpoints (Menus, Branch Configs, RBAC rules) use the `withCache` helper. If a cache entry is nearly expired (e.g., 5% of TTL remaining), the helper instantly serves the stale data to the client and fires an asynchronous background task to fetch fresh data from the PostgreSQL database, repopulating the Redis cache transparently. This eliminates "thundering herd" issues during high-traffic bursts.

### 3.2 Client Caching (`kwickly-client` Storefront)
- **Edge/ISR:** Menu items and global brand configurations are cached at the CDN level using Next.js Incremental Static Regeneration (ISR).
- **React Query:** Dynamic, user-specific data (Shopping Cart, Loyalty Wallet) utilizes `@tanstack/react-query` with a standard 30-second `staleTime`.

### 3.3 Admin Caching (`kwickly-admin-web` Dashboard)
- **React Query SPA:** All network requests in the admin dashboard use `@tanstack/react-query`.
- **Optimistic Updates:** For fast-paced admin actions (e.g., fulfilling an order), the UI updates instantly while the mutation processes in the background, providing a snappy experience.
- **Live Polling:** The Live KDS (Kitchen Display System) overrides caching with `staleTime: 0` to ensure no delayed or stale orders are shown to kitchen staff.
