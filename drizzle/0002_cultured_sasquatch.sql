CREATE INDEX "idx_aeronaves_tp_motor" ON "aeronaves" USING btree ("tp_motor");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_qt_motor" ON "aeronaves" USING btree ("qt_motor");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tp_pouso" ON "aeronaves" USING btree ("tp_pouso");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tp_ca" ON "aeronaves" USING btree ("tp_ca");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_cf_operacional" ON "aeronaves" USING btree ("cf_operacional");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_categoria" ON "aeronaves" USING btree ("ds_categoria_homologacao");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_tp_operacao" ON "aeronaves" USING btree ("tp_operacao");