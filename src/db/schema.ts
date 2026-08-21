import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const PERIODO_MANUAL = "MANUAL";

export const aeronaves = pgTable(
  "aeronaves",
  {
    marcas: text("marcas").notNull(),
    periodo: text("periodo").notNull(),
    nrCertMatricula: integer("nr_cert_matricula"),
    nrSerie: text("nr_serie"),
    cdTipo: text("cd_tipo"),
    dsModelo: text("ds_modelo"),
    nmFabricante: text("nm_fabricante"),
    cdCls: text("cd_cls"),
    nrPmd: numeric("nr_pmd", { precision: 8, scale: 0 }),
    cdTipoIcao: text("cd_tipo_icao"),
    nrTripulacaoMin: integer("nr_tripulacao_min"),
    nrPassageirosMax: integer("nr_passageiros_max"),
    nrAssentos: integer("nr_assentos"),
    nrAnoFabricacao: integer("nr_ano_fabricacao"),
    dtValidadeCva: text("dt_validade_cva"),
    dtValidadeCa: timestamp("dt_validade_ca", { mode: "date" }),
    dtCanc: timestamp("dt_canc", { mode: "date" }),
    dsMotivoCanc: text("ds_motivo_canc"),
    cdInterdicao: text("cd_interdicao"),
    dsGravame: text("ds_gravame"),
    dtMatricula: timestamp("dt_matricula", { mode: "date" }),
    tpMotor: text("tp_motor"),
    qtMotor: integer("qt_motor"),
    tpPouso: text("tp_pouso"),
    tpCa: text("tp_ca"),
    cdPropositoCave: text("cd_proposito_cave"),
    cfOperacional: text("cf_operacional"),
    dsCategoriaHomologacao: text("ds_categoria_homologacao"),
    tpOperacao: text("tp_operacao"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.marcas, t.periodo] }),
    index("idx_aeronaves_periodo").on(t.periodo),
    index("idx_aeronaves_modelo").on(t.dsModelo),
    index("idx_aeronaves_fabricante").on(t.nmFabricante),
    index("idx_aeronaves_cd_tipo").on(t.cdTipo),
    index("idx_aeronaves_ano").on(t.nrAnoFabricacao),
    index("idx_aeronaves_situacao").on(t.cdInterdicao),
    index("idx_aeronaves_tp_motor").on(t.tpMotor),
    index("idx_aeronaves_qt_motor").on(t.qtMotor),
    index("idx_aeronaves_tp_pouso").on(t.tpPouso),
    index("idx_aeronaves_tp_ca").on(t.tpCa),
    index("idx_aeronaves_cf_operacional").on(t.cfOperacional),
    index("idx_aeronaves_categoria").on(t.dsCategoriaHomologacao),
    index("idx_aeronaves_tp_operacao").on(t.tpOperacao),
    index("idx_aeronaves_periodo_fabricante").on(t.periodo, t.nmFabricante),
  ],
);

export const proprietarios = pgTable(
  "proprietarios",
  {
    documento: text("documento").notNull(),
    periodo: text("periodo").notNull(),
    nome: text("nome").notNull(),
    uf: text("uf"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.documento, t.periodo] }),
    index("idx_proprietarios_nome").on(t.nome),
    index("idx_proprietarios_uf").on(t.uf),
  ],
);

export const operadores = pgTable(
  "operadores",
  {
    documento: text("documento").notNull(),
    periodo: text("periodo").notNull(),
    nome: text("nome").notNull(),
    uf: text("uf"),
    operacao135: boolean("operacao135").notNull().default(false),
    transregular135: boolean("transregular135").notNull().default(false),
    autorizacaopmac135: boolean("autorizacaopmac135").notNull().default(false),
    operacao121: boolean("operacao121").notNull().default(false),
    transregular121: boolean("transregular121").notNull().default(false),
    autorizacaopmac121: boolean("autorizacaopmac121").notNull().default(false),
    sae: boolean("sae").notNull().default(false),
    authistrut: boolean("authistrut").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.documento, t.periodo] }),
    index("idx_operadores_nome").on(t.nome),
    index("idx_operadores_uf").on(t.uf),
  ],
);

export const aeronaveProprietarios = pgTable(
  "aeronave_proprietarios",
  {
    aeronaveMarcas: text("aeronave_marcas").notNull(),
    periodo: text("periodo").notNull(),
    proprietarioDocumento: text("proprietario_documento").notNull(),
    percentual: numeric("percentual", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.aeronaveMarcas, t.periodo, t.proprietarioDocumento],
    }),
    index("idx_aeronave_prop_proprietario").on(t.proprietarioDocumento),
    index("idx_aeronave_prop_periodo").on(t.periodo),
    index("idx_aeronave_prop_marcas_periodo").on(t.aeronaveMarcas, t.periodo),
  ],
);

export const aeronaveOperadores = pgTable(
  "aeronave_operadores",
  {
    aeronaveMarcas: text("aeronave_marcas").notNull(),
    periodo: text("periodo").notNull(),
    operadorDocumento: text("operador_documento").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.aeronaveMarcas, t.periodo, t.operadorDocumento],
    }),
    index("idx_aeronave_op_operador").on(t.operadorDocumento),
    index("idx_aeronave_op_periodo").on(t.periodo),
    index("idx_aeronave_op_marcas_periodo").on(t.aeronaveMarcas, t.periodo),
  ],
);

export const usuarios = pgTable(
  "usuarios",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    nome: text("nome").notNull(),
    login: text("login").notNull().unique(),
    senhaHash: text("senha_hash").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("idx_usuarios_login").on(t.login)],
);

import { relations } from "drizzle-orm";

export const aeronavesRelations = relations(aeronaves, ({ many }) => ({
  proprietarios: many(aeronaveProprietarios),
  operadores: many(aeronaveOperadores),
}));

export const proprietariosRelations = relations(proprietarios, ({ many }) => ({
  aeronaves: many(aeronaveProprietarios),
}));

export const operadoresRelations = relations(operadores, ({ many }) => ({
  aeronaves: many(aeronaveOperadores),
}));

export const aeronaveProprietariosRelations = relations(
  aeronaveProprietarios,
  ({ one }) => ({
    aeronave: one(aeronaves, {
      fields: [aeronaveProprietarios.aeronaveMarcas, aeronaveProprietarios.periodo],
      references: [aeronaves.marcas, aeronaves.periodo],
    }),
    proprietario: one(proprietarios, {
      fields: [aeronaveProprietarios.proprietarioDocumento, aeronaveProprietarios.periodo],
      references: [proprietarios.documento, proprietarios.periodo],
    }),
  }),
);

export const aeronaveOperadoresRelations = relations(
  aeronaveOperadores,
  ({ one }) => ({
    aeronave: one(aeronaves, {
      fields: [aeronaveOperadores.aeronaveMarcas, aeronaveOperadores.periodo],
      references: [aeronaves.marcas, aeronaves.periodo],
    }),
    operador: one(operadores, {
      fields: [aeronaveOperadores.operadorDocumento, aeronaveOperadores.periodo],
      references: [operadores.documento, operadores.periodo],
    }),
  }),
);

export type Aeronave = typeof aeronaves.$inferSelect;
export type NovaAeronave = typeof aeronaves.$inferInsert;
export type Proprietario = typeof proprietarios.$inferSelect;
export type Operador = typeof operadores.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;