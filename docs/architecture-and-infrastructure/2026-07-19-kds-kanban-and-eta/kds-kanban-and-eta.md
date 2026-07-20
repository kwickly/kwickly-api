# KDS Kanban Redesign & ETA System

**Date:** 2026-07-19  
**Status:** ✅ Completed  
**Repo:** kwickly-api  

---

## Context

The original KDS was a static list with no drag-and-drop. The admin web showed image-heavy order cards that were not useful to kitchen staff who need fast, dense, text-only information. There was also no ETA calculation for customers.

---

## Decision

### ETA Calculation

Added `defaultPreparationTime` (integer, minutes) to `tenants` table.

`getPublicOrderStatus()` in `orders.service.ts` now:
1. Fetches tenant `defaultPreparationTime` 
2. Computes `estimatedCompletionTime = order.createdAt + preparationTime`
3. Returns `estimatedCompletionTime` in the public status endpoint
4. Clients use SSE (`/public/status/:orderId/sse`) for live countdown

### KDS Kanban Board (`Kds.tsx`)

- **@dnd-kit/core** for drag-and-drop between columns
- Columns: Pending → In Kitchen → Ready (forward-only enforcement)
- Text-dense, **no images** — QR-era kitchen UX
- Wait-time urgency badges: green < 10 min, amber 10–20 min, red pulsing > 20 min
- DragOverlay shows rotated card while dragging
- WebSocket connection to `/kds?token=&branchId=`

### Migration

`drizzle-kit push --force` applied migration `0005_narrow_hairball.sql`.

---

## Future: KOT Round Badges

Phase 9 will add `kotRound` to the KOT schema. The KDS will then show "Rnd 2" badges on subsequent round tickets.
