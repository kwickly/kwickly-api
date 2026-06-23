ALTER TABLE "tenants" ALTER COLUMN "brand_color" SET DEFAULT '#4f46e5';--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "brand_color" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "logo_dark_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "theme_mode" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "theme_config" jsonb DEFAULT '{"light":{},"dark":{},"fonts":{"sans":"Open Sans, sans-serif","serif":"Georgia, serif","mono":"Menlo, monospace"}}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "base_currency" text DEFAULT 'INR' NOT NULL;