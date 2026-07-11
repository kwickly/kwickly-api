CREATE TYPE "public"."device_status" AS ENUM('active', 'offline', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('POS', 'KDS');--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "device_type" DEFAULT 'POS' NOT NULL,
	"pairing_code" text,
	"pairing_code_expires_at" timestamp,
	"status" "device_status" DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_brandings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"brand_color" text DEFAULT '#4f46e5' NOT NULL,
	"logo_url" text,
	"logo_dark_url" text,
	"favicon_url" text,
	"theme_mode" text DEFAULT 'system' NOT NULL,
	"theme_config" jsonb DEFAULT '{"light":{},"dark":{},"fonts":{"sans":"Open Sans, sans-serif","serif":"Georgia, serif","mono":"Menlo, monospace"}}'::jsonb,
	"custom_domain" text,
	"custom_email_sender" text,
	"hide_kwickly_branding" boolean DEFAULT false NOT NULL,
	"custom_pwa_manifest" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_brandings_tenant_id_unique" UNIQUE("tenant_id"),
	CONSTRAINT "tenant_brandings_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pos_pin" text;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_brandings" ADD CONSTRAINT "tenant_brandings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "brand_color";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "logo_dark_url";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "favicon_url";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "theme_mode";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "theme_config";