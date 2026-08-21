ALTER TABLE "aeronaves" ADD COLUMN "hash" text;--> statement-breakpoint
CREATE INDEX "idx_aeronaves_hash" ON "aeronaves" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_periodo_hash" ON "aeronaves" USING btree ("periodo", "hash");
