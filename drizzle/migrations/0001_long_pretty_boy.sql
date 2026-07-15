ALTER TABLE "in_app_ads" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "in_app_ads" ALTER COLUMN "status" SET DATA TYPE "public"."promotion_status" USING "status"::text::"public"."promotion_status";--> statement-breakpoint
ALTER TABLE "in_app_ads" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "staff_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."promotionStatusEnum";