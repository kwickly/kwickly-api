ALTER TABLE "tenants" ADD COLUMN "allow_takeaway_on_dine_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "fulfillment_mode" "order_mode";