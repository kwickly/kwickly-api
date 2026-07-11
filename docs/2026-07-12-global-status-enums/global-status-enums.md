# Global Status Enums & Soft Deletes Architecture

To adhere to SaaS industry best practices, the `isActive` boolean flag has been officially deprecated across the entire platform in favor of semantic string Enums. This ensures that every entity has precise state management instead of ambiguous active/inactive states.

## Database Schema Changes

Every operational entity in the database has been migrated to use specific Enums:

1. **Users & Staff (`users.ts`)**
   - **Enum:** `userStatusEnum('ACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE')`

2. **Branches (`branches.ts`)**
   - **Enum:** `branchStatusEnum('ACTIVE', 'TEMPORARILY_CLOSED', 'PERMANENTLY_CLOSED')`

3. **Menus (`menus.ts` - Categories, Items, Addons)**
   - **Enum:** `menuItemStatusEnum('AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN')`

4. **Promotions & Ads (`promotions.ts`, `ads.ts`)**
   - **Enum:** `promotionStatusEnum('ACTIVE', 'PAUSED', 'EXPIRED')`

5. **Subscriptions (`subscriptions.ts`)**
   - **SaaS Plans:** `planStatusEnum('ACTIVE', 'GRANDFATHERED', 'ARCHIVED')`
   - **Customer Subscriptions:** `customerSubStatusEnum('ACTIVE', 'PAUSED', 'CANCELLED', 'PAYMENT_FAILED')`

6. **Combos (`combos.ts`)**
   - **Enum:** `comboStatusEnum('ACTIVE', 'PAUSED')`

## Backend Implementation

- **Soft Deletes:** Every table now has a `deletedAt` column. All API queries (`.findMany`, `.findFirst`) MUST explicitly check `isNull(table.deletedAt)`. `DELETE` endpoints must be converted to `UPDATE` endpoints that set `deletedAt`.
- **Elysia Validation:** API payload validations have been updated from `t.Boolean()` to `t.Enum()` to rigorously enforce these new states.

## Frontend Implementation

- **Forms and Modals:** UI toggle switches (representing true/false) have been converted to `<Select>` dropdowns to accommodate the multi-state Enums.
- **Data Tables:** Semantic colored badges (Green for `ACTIVE`/`AVAILABLE`, Yellow/Orange for `PAUSED`/`OUT_OF_STOCK`, Red for `TERMINATED`/`CLOSED`) represent the new states.
- **The Tenant Lock Screen:** When a user belongs to a `SUSPENDED` or `TERMINATED` tenant, the backend still authorizes their login. However, the frontend layout router intercepts their session and renders an impassable "Account Suspended" lock screen, instructing them to contact support.
