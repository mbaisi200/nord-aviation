ALTER TABLE "aeronaves" ADD COLUMN "ds_tipo_icao_nome" text;--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tipo_icao" ON "aeronaves" USING btree ("cd_tipo_icao");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tipo_icao_nome" ON "aeronaves" USING btree ("ds_tipo_icao_nome");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tipo_icao_nome_trgm" ON "aeronaves" USING gin ("ds_tipo_icao_nome" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_aeronaves_marcas_trgm" ON "aeronaves" USING gin ("marcas" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_aeronaves_modelo_trgm" ON "aeronaves" USING gin ("ds_modelo" gin_trgm_ops);
