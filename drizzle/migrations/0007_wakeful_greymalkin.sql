ALTER TABLE "menu_categories" DROP CONSTRAINT "menu_categories_branch_id_branches_id_fk";
--> statement-breakpoint
DROP INDEX "unq_cat_tenant_branch_name";--> statement-breakpoint
CREATE UNIQUE INDEX "unq_cat_tenant_name" ON "menu_categories" USING btree ("tenant_id","name");--> statement-breakpoint
ALTER TABLE "menu_categories" DROP COLUMN "branch_id";