# Cloudinary Image Upload & Storage Metadata Lifecycle

## 📖 Overview
To support modern, dynamic brand customization and media-enriched menu listings, the Kwickly platform requires a scalable, low-latency image upload and storage system. This document outlines the technical design, database schemas, direct client uploader component, and server-side lifecycle rules for managing restaurant brand assets and product images.

---

## 🛠️ Infrastructure Decision

### 1. Cloudinary Direct Unsigned Uploads
To optimize network bandwidth and offload file processing from the ElysiaJS backend API, the client application (`kwickly-admin-web`) uploads files directly to **Cloudinary** using an unsigned upload preset. This approach provides:
* **Offloaded Bandwidth:** Zero load on backend API servers for heavy file uploads.
* **On-the-fly Transformations:** Optimization of sizes, aspect ratios, and format conversions (WebP/AVIF) directly at the CDN layer.
* **Instant Feedback:** Quick loading states and direct URL generation on the client-side.

### 2. Backend Metadata Auditing
To ensure data integrity, the ElysiaJS backend stores image locations along with structured metadata (`JSONB`) to audit asset sizes, file formats, and provider source details:
* `imageUrl` (string): The public CDN secure URL.
* `imageMetadata` (jsonb): Structured details containing `provider`, `publicId`, `format`, and `bytes`.

---

## 💾 Database Schema Reference

The following tables have been enriched with `JSONB` columns to track image metadata:

### 1. Tenant Brandings
* **File:** [tenants.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Kwickly/Garage/kwickly-api/src/db/schema/tenants.ts)
```typescript
export const tenantBrandings = pgTable('tenant_brandings', {
  // ...
  logoUrl: text('logo_url'),
  logoMetadata: jsonb('logo_metadata'),
  logoDarkUrl: text('logo_dark_url'),
  logoDarkMetadata: jsonb('logo_dark_metadata'),
  faviconUrl: text('favicon_url'),
  faviconMetadata: jsonb('favicon_metadata'),
});
```

### 2. Menus (Categories & Items)
* **File:** [menus.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Kwickly/Garage/kwickly-api/src/db/schema/menus.ts)
```typescript
export const menuCategories = pgTable('menu_categories', {
  // ...
  imageUrl: text('image_url'),
  imageMetadata: jsonb('image_metadata'),
});

export const menuItems = pgTable('menu_items', {
  // ...
  imageUrl: text('image_url'),
  imageMetadata: jsonb('image_metadata'),
});
```

### 3. Combos & In-App Ads
* **Files:** [combos.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Kwickly/Garage/kwickly-api/src/db/schema/combos.ts), [ads.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Kwickly/Garage/kwickly-api/src/db/schema/ads.ts)
```typescript
// combos
imageUrl: text('image_url'),
imageMetadata: jsonb('image_metadata'),

// in_app_ads
imageUrl: text('image_url'),
imageMetadata: jsonb('image_metadata'),
```

---

## 🧹 Asset Deletion Lifecycle

To prevent orphan assets from accumulating in Cloudinary storage, the backend implements automated deletion hooks during update and deletion operations:

1. **Comparison on Update:** When an asset URL is updated, the server checks the existing database row. If the old record has a Cloudinary `publicId` and the new URL is different, the server triggers `deleteCloudinaryAsset(publicId)` before writing the new settings.
2. **Cleanup on Delete:** When a menu item or category is deleted, the server queries the database record and issues a delete request to Cloudinary for the associated `publicId`.

---

## 🖥️ UI Integration: ImageDropzone

A reusable `<ImageDropzone>` component handles dragging, dropping, and clicking events to fire direct unsigned uploads to Cloudinary:
* **Path:** `src/components/ui/image-dropzone.tsx` in `kwickly-admin-web`.
* **State Management:** Returns both `url` (saved as `imageUrl` in forms) and `metadata` (saved as `imageMetadata` in forms) on completion.
