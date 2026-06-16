ALTER TABLE "users" ADD COLUMN "password" text;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_branch_tenant_name" ON "branches" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_cat_tenant_branch_name" ON "menu_categories" USING btree ("tenant_id","branch_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_item_tenant_cat_name" ON "menu_items" USING btree ("tenant_id","category_id","name");