ALTER TABLE "audit_logs" ADD COLUMN "user_role" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "status_code" integer;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;