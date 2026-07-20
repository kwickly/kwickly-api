# Table Management & Order Session Architecture

**Date:** 2026-07-19  
**Status:** 🟡 Planned — Implementation Pending  
**Repo:** kwickly-api  

---

## Context

Prior to this decision, `tableNumber` was a free-text field on the `orders` table. There was no concept of registered tables, QR tokens, or table sessions. Every checkout call created a brand-new order — meaning a dine-in customer ordering multiple rounds would generate multiple disconnected orders, making consolidated billing impossible.

---

## Decision

### 1. New table: `restaurant_tables`

A registered table registry per branch.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Permanent — baked into QR URL forever |
| `branchId` | UUID FK | — |
| `name` | text | "T1", "Patio 3", "Counter" |
| `capacity` | integer | optional |
| `status` | enum | `available`, `occupied`, `reserved`, `cleaning` |
| `qrToken` | text UNIQUE | Short token e.g. `xk7p2`. Regeneratable without changing `id`. |
| `currentSessionId` | UUID nullable FK | FK → `table_sessions.id` |
| `sortOrder` | integer | For floor view grid ordering |

**QR URL format:** `https://{slug}.kwickly.app/menu?t={qrToken}`

### 2. New table: `table_sessions`

One open session per occupied table. Owns the master order.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `tableId` | UUID FK | — |
| `branchId` | UUID FK | — |
| `orderId` | UUID FK | The ONE master order for this session |
| `kotRound` | integer default 0 | Incremented each time items are added |
| `openedAt` | timestamp | First order time |
| `closedAt` | timestamp nullable | Set when staff prints bill |
| `status` | enum | `open`, `closed` |

### 3. Modify `kots`
- Add `kotRound` integer — which round of the session (1, 2, 3…)
- Add `tableSessionId` UUID nullable FK

### 4. Modify `orders`
- Add `tableId` UUID nullable FK → `restaurant_tables.id`
- Add `sessionId` UUID nullable FK → `table_sessions.id`
- Keep `tableNumber` text — used for POS orders without registered tables

### 5. Modify `tenants`
- Add `maxTables` integer — plan-gated (FREE=0, BASIC=10, STARTER=25, GROWTH=75, ENTERPRISE=unlimited)

---

## Plan-Gated Table Limits

| Plan | Max Tables |
|---|---|
| FREE | 0 |
| BASIC | 10 |
| STARTER | 25 |
| GROWTH | 75 |
| ENTERPRISE | Unlimited |
| CUSTOM | Configurable |

---

## Tables Are Optional

`tableId` is always nullable. A `null` tableId = tableless standalone order.

| Scenario | tableId | sessionId |
|---|---|---|
| QR dine-in | ✅ Set | ✅ Set |
| POS walk-in | null | null |
| Counter takeaway | null | null |

---

## New API Endpoints

```
GET    /v1/tables?branchId=
POST   /v1/tables
PATCH  /v1/tables/:id
DELETE /v1/tables/:id
POST   /v1/tables/:id/regenerate-qr
GET    /v1/tables/:id/qr-url
POST   /v1/sessions/:id/close
POST   /public/:slug/add-items
```

---

## Consequences

- ✅ Consolidated billing — one order per session
- ✅ Kitchen sees only new items per round
- ✅ Floor view shows live table occupancy
- ✅ QR token rotation = instant security
- ✅ Tableless orders work as before
- ⚠️ Requires DB migration: 2 new tables + 4 new columns
