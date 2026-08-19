CREATE TABLE "aeronave_operadores" (
	"aeronave_marcas" text NOT NULL,
	"operador_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aeronave_operadores_aeronave_marcas_operador_id_pk" PRIMARY KEY("aeronave_marcas","operador_id")
);
--> statement-breakpoint
CREATE TABLE "aeronave_proprietarios" (
	"aeronave_marcas" text NOT NULL,
	"proprietario_id" integer NOT NULL,
	"percentual" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aeronave_proprietarios_aeronave_marcas_proprietario_id_pk" PRIMARY KEY("aeronave_marcas","proprietario_id")
);
--> statement-breakpoint
CREATE TABLE "aeronaves" (
	"marcas" text PRIMARY KEY NOT NULL,
	"nr_cert_matricula" integer,
	"nr_serie" text,
	"cd_tipo" text,
	"ds_modelo" text,
	"nm_fabricante" text,
	"cd_cls" text,
	"nr_pmd" numeric(8, 0),
	"cd_tipo_icao" text,
	"nr_tripulacao_min" integer,
	"nr_passageiros_max" integer,
	"nr_assentos" integer,
	"nr_ano_fabricacao" integer,
	"dt_validade_cva" text,
	"dt_validade_ca" timestamp,
	"dt_canc" timestamp,
	"ds_motivo_canc" text,
	"cd_interdicao" text,
	"ds_gravame" text,
	"dt_matricula" timestamp,
	"tp_motor" text,
	"qt_motor" integer,
	"tp_pouso" text,
	"tp_ca" text,
	"cd_proposito_cave" text,
	"cf_operacional" text,
	"ds_categoria_homologacao" text,
	"tp_operacao" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operadores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "operadores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"documento" text NOT NULL,
	"uf" text,
	"operacao135" boolean DEFAULT false NOT NULL,
	"transregular135" boolean DEFAULT false NOT NULL,
	"autorizacaopmac135" boolean DEFAULT false NOT NULL,
	"operacao121" boolean DEFAULT false NOT NULL,
	"transregular121" boolean DEFAULT false NOT NULL,
	"autorizacaopmac121" boolean DEFAULT false NOT NULL,
	"sae" boolean DEFAULT false NOT NULL,
	"authistrut" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operadores_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
CREATE TABLE "proprietarios" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "proprietarios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"documento" text NOT NULL,
	"uf" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proprietarios_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
ALTER TABLE "aeronave_operadores" ADD CONSTRAINT "aeronave_operadores_aeronave_marcas_aeronaves_marcas_fk" FOREIGN KEY ("aeronave_marcas") REFERENCES "public"."aeronaves"("marcas") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aeronave_operadores" ADD CONSTRAINT "aeronave_operadores_operador_id_operadores_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."operadores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aeronave_proprietarios" ADD CONSTRAINT "aeronave_proprietarios_aeronave_marcas_aeronaves_marcas_fk" FOREIGN KEY ("aeronave_marcas") REFERENCES "public"."aeronaves"("marcas") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aeronave_proprietarios" ADD CONSTRAINT "aeronave_proprietarios_proprietario_id_proprietarios_id_fk" FOREIGN KEY ("proprietario_id") REFERENCES "public"."proprietarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aeronave_op_operador" ON "aeronave_operadores" USING btree ("operador_id");--> statement-breakpoint
CREATE INDEX "idx_aeronave_prop_proprietario" ON "aeronave_proprietarios" USING btree ("proprietario_id");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_modelo" ON "aeronaves" USING btree ("ds_modelo");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_fabricante" ON "aeronaves" USING btree ("nm_fabricante");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_cd_tipo" ON "aeronaves" USING btree ("cd_tipo");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_ano" ON "aeronaves" USING btree ("nr_ano_fabricacao");--> statement-breakpoint
CREATE INDEX "idx_aeronaves_situacao" ON "aeronaves" USING btree ("cd_interdicao");--> statement-breakpoint
CREATE INDEX "idx_operadores_nome" ON "operadores" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "idx_operadores_uf" ON "operadores" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "idx_proprietarios_nome" ON "proprietarios" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "idx_proprietarios_uf" ON "proprietarios" USING btree ("uf");