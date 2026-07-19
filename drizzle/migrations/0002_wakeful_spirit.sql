ALTER TYPE "public"."tenant_plan" ADD VALUE 'BASIC' BEFORE 'STARTER';--> statement-breakpoint
ALTER TYPE "public"."tenant_plan" ADD VALUE 'CUSTOM';--> statement-breakpoint
CREATE TABLE "tenant_billing_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"sms_count" integer DEFAULT 0 NOT NULL,
	"active_staff_count" integer DEFAULT 0 NOT NULL,
	"active_device_count" integer DEFAULT 0 NOT NULL,
	"amount_due" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fcm_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"device_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "fcm_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'BASIC';--> statement-breakpoint
ALTER TABLE "tenant_brandings" ADD COLUMN "enabled_modules" jsonb DEFAULT '{"dineIn":true,"takeaway":false,"delivery":false,"subscriptions":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_model" text DEFAULT 'FLAT' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "base_fee" numeric(10, 2) DEFAULT '499.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "custom_order_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "max_orders_per_month" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "enabled_addons" jsonb DEFAULT '{"inventory":false,"payroll":false,"crm":false,"ai":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_billing_meters" ADD CONSTRAINT "tenant_billing_meters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tenantBillingMeters_tenant_id" ON "tenant_billing_meters" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fcmTokens_tenant_id" ON "fcm_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fcmTokens_user_id" ON "fcm_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_branches_tenant_id" ON "branches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_roles_tenant_id" ON "roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payrollRuns_tenant_id" ON "payroll_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_salarySlips_tenant_id" ON "salary_slips" USING btree ("tenant_id");