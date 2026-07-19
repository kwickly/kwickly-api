ALTER TABLE "menu_items" ADD COLUMN "is_bestseller" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_chef_special" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_restaurant_special" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_new" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_popular" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_limited_edition" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_healthy_choice" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "calories" integer;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "serving_size" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "ingredients" text[];--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "allergens" text[];--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "protein" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "carbs" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "fat" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "available_days" text[];--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "available_until_date" text;