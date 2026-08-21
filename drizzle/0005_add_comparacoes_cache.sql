CREATE TABLE IF NOT EXISTS "comparacoes_cache" (
  "base" text NOT NULL,
  "alvo" text NOT NULL,
  "filtros_hash" text NOT NULL,
  "filtros" text NOT NULL,
  "resultado" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("base", "alvo", "filtros_hash")
);--> statement-breakpoint
CREATE INDEX "idx_comparacoes_cache_base_alvo" ON "comparacoes_cache" USING btree ("base", "alvo");--> statement-breakpoint
CREATE INDEX "idx_comparacoes_cache_updated" ON "comparacoes_cache" USING btree ("updated_at");
