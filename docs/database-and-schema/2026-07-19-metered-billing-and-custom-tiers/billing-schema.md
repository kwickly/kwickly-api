# ADR: Metered Billing & Custom Tiers Database Schema

**Date:** 2026-07-19  
**Domain:** Database & Schema  
**Status:** Approved  

---

## 1. Context

The Kwickly platform requires a flexible, transaction-volume-based (metered) billing engine and custom tiers to accommodate various restaurant sizes and negotiated pricing agreements.

To calculate monthly invoices, track order/SMS limits, and expose module toggles to frontends, we must update the core `tenants` schema, introduce a monthly usage tracker table, and update public endpoints to expose billing parameters.

---

## 2. Decision

We will extend the database schema and expose billing attributes through public and B2B API endpoints.

### A. Schema Updates
1. **`tenants` table:**
   * Add `billingModel` enum: `'FLAT'` or `'METERED'`.
   * Add `baseFee` (decimal): Base monthly access charge.
   * Add `customOrderRate` (decimal, optional): Flat rate per order to override tiered brackets for custom agreements.
   * Add `maxOrdersPerMonth` (integer): Hard ceiling for orders (used for the Free tier limits).
2. **`tenant_brandings` table:**
   * Add `enabledModules` (JSONB): Granular toggles for storefront modules:
     ```json
     {
       "dineIn": true,
       "takeaway": true,
       "delivery": false,
       "subscriptions": false
     }
     ```
3. **`tenant_billing_meters` table (New):**
   * Fields: `id`, `tenantId`, `billingPeriodStart`, `billingPeriodEnd`, `orderCount`, `smsCount`, `amountDue`, `status` (`PENDING` | `INVOICED` | `PAID`).

### B. Business Rules & Metering Engine
* **Tiers Enforcement:**
  * Basic/Basic-tier tenants cannot exceed `maxOrdersPerMonth` (default 100). The storefront client will check this limit before allowing checkouts.
  * PAYG metered accounts are subject to a minimum active hosting fee of ₹299/month.
  * Growth/Starter/Enterprise plans will dynamically calculate fees based on actual monthly transaction count or custom flat rates:
    * 0 - 1,500 orders/mo: ₹4.00 / order
    * 1,501 - 3,000 orders/mo: ₹3.00 / order
    * 3,001 - 10,000 orders/mo: ₹2.00 / order
    * > 10,000 orders/mo: ₹1.50 / order
  * Excess SMS consumption will be metered and charged at ₹1.50 per SMS.
* **WebSocket/B2B APIs:**
  * The `/v1/auth/branding` public endpoint will include `plan` and `enabledModules` so client storefronts can dynamically toggle UI elements without loading private configs.

---

## 3. Consequences

* **Database Reliability:** Keeps historical track of consumption metrics and supports clean, audit-compliant automated invoicing.
* **Unified API Contracts:** Storefront and Admin Web client apps consume the same validated configuration attributes.
* **Extensibility:** Simple schema design allows adding future metered features (e.g. WhatsApp notifications, marketing templates, or third-party CRM integrations) easily.
