CREATE TYPE "public"."order_mode" AS ENUM('dine_in', 'takeaway', 'delivery');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "mode" "order_mode" DEFAULT 'dine_in' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method";