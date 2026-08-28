// @ts-nocheck
"use server";

import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aeronaveOperadores,
  aeronaveProprietarios,
  aeronaves,
  operadores,
  proprietarios,
} from "@/db/schema";
import { exigirSessao } from "@/lib/auth";
import { PERIODO_MANUAL } from "@/db/schema";
import { formatarData, formatarNumero } from "@/lib/format";

import { compararCache, COMPARAR_TTL } from "@/lib/comparar-cache";
import { comparacoesCache } from "@/db/schema";
import { createHash } from "crypto";
function cacheKey(base: string, alvo: string, pagina: number, porPagina: number, filtros: FiltrosComparacao) {
  return `${base}|${alvo}|${pagina}|${porPagina}|${JSON.stringify(filtros)}`;
}
function filtrosHashKey(base: string, alvo: string, pagina: number, porPagina: number, filtros: FiltrosComparacao) {
  return createHash("md5").update(JSON.stringify({ base, alvo, pagina, porPagina, filtros })).digest("hex");
}

type TipoCampo = "text" | "int" | "date" | "numeric";

const CAMPOS: {
  coluna: string;
  prop: string;
  rotulo: string;
  tipo: TipoCampo;
}[] = [
  { coluna: "nr_cert_matricula", prop: "nrCertMatricula", rotulo: "Nº certificado de matrícula", tipo: "int" },
  { coluna: "nr_serie", prop: "nrSerie", rotulo: "Nº de série", tipo: "text" },
  { coluna: "cd_tipo", prop: "cdTipo", rotulo: "Código de tipo", tipo: "text" },
  { coluna: "ds_modelo", prop: "dsModelo", rotulo: "Modelo", tipo: "text" },
  { coluna: "nm_fabricante", prop: "nmFabricante", rotulo: "Fabricante", tipo: "text" },
  { coluna: "cd_cls", prop: "cdCls", rotulo: "Classe", tipo: "text" },
  { coluna: "nr_pmd", prop: "nrPmd", rotulo: "PMD (kg)", tipo: "numeric" },
  { coluna: "cd_tipo_icao", prop: "cdTipoIcao", rotulo: "Tipo ICAO", tipo: "text" },
  { coluna: "nr_tripulacao_min", prop: "nrTripulacaoMin", rotulo: "Tripulação mínima", tipo: "int" },
  { coluna: "nr_passageiros_max", prop: "nrPassageirosMax", rotulo: "Passageiros máx.", tipo: "int" },
  { coluna: "nr_assentos", prop: "nrAssentos", rotulo: "Assentos", tipo: "int" },
  { coluna: "nr_ano_fabricacao", prop: "nrAnoFabricacao", rotulo: "Ano de fabricação", tipo: "int" },
  { coluna: "dt_validade_cva", prop: "dtValidadeCva", rotulo: "Validade CVA", tipo: "text" },
  { coluna: "dt_validade_ca", prop: "dtValidadeCa", rotulo: "Validade CA", tipo: "date" },
  { coluna: "dt_canc", prop: "dtCanc", rotulo: "Cancelamento", tipo: "date" },
  { coluna: "ds_motivo_canc", prop: "dsMotivoCanc", rotulo: "Motivo de cancelamento", tipo: "text" },
  { coluna: "cd_interdicao", prop: "cdInterdicao", rotulo: "Status da Aeronave", tipo: "text" },  // NOTE: coluna do banco continua cd_interdicao — importações futuras que vierem com o campo CD_INTERDICAO serão mapeadas automaticamente
  { coluna: "ds_gravame", prop: "dsGravame", rotulo: "Gravame", tipo: "text" },
  { coluna: "dt_matricula", prop: "dtMatricula", rotulo: "Data de matrícula", tipo: "date" },
  { coluna: "tp_motor", prop: "tpMotor", rotulo: "Tipo de motor", tipo: "text" },
  { coluna: "qt_motor", prop: "qtMotor", rotulo: "Quantidade de motores", tipo: "int" },
  { coluna: "tp_pouso", prop: "tpPouso", rotulo: "Tipo de pouso", tipo: "text" },
  { coluna: "tp_ca", prop: "tpCa", rotulo: "Tipo de CA", tipo: "text" },
  { coluna: "cd_proposito_cave", prop: "cdPropositoCave", rotulo: "Propósito CAVE", tipo: "text" },
  { coluna: "cf_operacional", prop: "cfOperacional", rotulo: "CF operacional", tipo: "text" },
  { coluna: "ds_categoria_homologacao", prop: "dsCategoriaHomologacao", rotulo: "Categoria de homologação", tipo: "text" },
  { coluna: "tp_operacao", prop: "tpOperacao", rotulo: "Tipo de operação", tipo: "text" },
];

const LISTA_CAMPOS_SQL = CAMPOS.map((c) => c.coluna).join(", ");

export async function listarPeriodos(): Promise<string[]> {
  await exigirSessao();
  const r = await db.execute(sql`
    SELECT DISTINCT periodo FROM aeronaves
    WHERE periodo <> ${PERIODO_MANUAL}
    ORDER BY periodo DESC
  `);
  return r.rows.map((x) => x.periodo as string);
}

function normalizar(valor: unknown, tipo: TipoCampo): string {
  if (valor == null) return "";
  if (tipo === "date") {
    const d = valor instanceof Date ? valor : new Date(String(valor));
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  return String(valor).trim();
}

function exibir(valor: unknown, tipo: TipoCampo): string {
  if (valor == null || valor === "") return "—";
  if (tipo === "date") {
    const d = valor instanceof Date ? valor : new Date(String(valor));
    return formatarData(d);
  }
  if (tipo === "numeric") return formatarNumero(String(valor));
  if (tipo === "int") return formatarNumero(String(valor));
  return String(valor);
}

export type DiferencaCampo = {
  campo: string;
  antes: string;
  depois: string;
};

type EntidadeVinculo = {
  documento: string;
  nome: string;
  uf: string | null;
  percentual?: string | null;
};

export type DiferencaProprietarios = {
  adicionados: string[];
  removidos: string[];
  alterados: { entidade: string; antes: string; depois: string }[];
};

export type DiferencaOperadores = {
  adicionados: string[];
  removidos: string[];
  alterados: { entidade: string; antes: string; depois: string }[];
};

export type DiferencaAeronave = {
  marcas: string;
  modelo: string | null;
  tipoIcao: string | null;
  tipoIcaoNome: string | null;
  anoFabricacao: number | null;
  campos: DiferencaCampo[];
  proprietarios: DiferencaProprietarios;
  operadores: DiferencaOperadores;
};

export type EstatisticasComparacao = {
  camposMaisAlterados: { rotulo: string; quantidade: number; valorMaisComum: string }[];
  novosPorFabricante: { fabricante: string; quantidade: number }[];
  removidosPorFabricante: { fabricante: string; quantidade: number }[];
};

export type NovoDetalhado = {
  marcas: string;
  periodo?: string;
  modelo: string | null;
  tipoIcao: string | null;
  tipoIcaoNome: string | null;
  fabricante: string | null;
  anoFabricacao: number | null;
  nrCertMatricula?: number | null;
  nrSerie?: string | null;
  cdTipo?: string | null;
  cdCls?: string | null;
  nrPmd?: string | null;
  nrTripulacaoMin?: number | null;
  nrPassageirosMax?: number | null;
  nrAssentos?: number | null;
  dtValidadeCva?: string | null;
  dtValidadeCa?: Date | null;
  dtCanc?: Date | null;
  dsMotivoCanc?: string | null;
  cdInterdicao?: string | null;
  dsGravame?: string | null;
  dtMatricula?: Date | null;
  tpMotor?: string | null;
  qtMotor?: number | null;
  tpPouso?: string | null;
  tpCa?: string | null;
  cdPropositoCave?: string | null;
  cfOperacional?: string | null;
  dsCategoriaHomologacao?: string | null;
  tpOperacao?: string | null;
  operadores: string[];
  proprietarios: string[];
};

export type ResultadoComparacao = {
  base: string;
  alvo: string;
  resumo: {
    novos: number;
    removidos: number;
    alterados: number;
    semAlteracao: number;
  };
  estatisticas: EstatisticasComparacao;
  novos: NovoDetalhado[];
  removidos: NovoDetalhado[];
  alterados: DiferencaAeronave[];
  pagina: number;
  paginas: number;
};

function descricaoVinculo(e: EntidadeVinculo): string {
  let s = `${e.nome} (${e.documento})`;
  if (e.uf) s += ` · ${e.uf}`;
  if (e.percentual != null && e.percentual !== "") {
    s += ` · ${Number(e.percentual).toLocaleString("pt-BR")}%`;
  }
  return s;
}

function compararVinculos(
  base: Map<string, EntidadeVinculo>,
  alvo: Map<string, EntidadeVinculo>,
): { adicionados: string[]; removidos: string[]; alterados: { entidade: string; antes: string; depois: string }[] } {
  const adicionados: string[] = [];
  const removidos: string[] = [];
  const alterados: { entidade: string; antes: string; depois: string }[] = [];
  for (const [doc, e] of alvo) {
    if (!base.has(doc)) adicionados.push(descricaoVinculo(e));
  }
  for (const [doc, e] of base) {
    if (!alvo.has(doc)) removidos.push(descricaoVinculo(e));
  }
  for (const [doc, eBase] of base) {
    const eAlvo = alvo.get(doc);
    if (eAlvo) {
      const antes = descricaoVinculo(eBase);
      const depois = descricaoVinculo(eAlvo);
      if (antes !== depois) {
        alterados.push({ entidade: `${eBase.nome} (${doc})`, antes, depois });
      }
    }
  }
  return { adicionados, removidos, alterados };
}

export type ResultadoComparacaoMatricula = {
  marcas: string;
  base: string;
  alvo: string;
  existeBase: boolean;
  existeAlvo: boolean;
  campos: { rotulo: string; antes: string; depois: string; mudou: boolean }[];
  proprietarios: { antes: string; depois: string; mudou: boolean };
  operadores: { antes: string; depois: string; mudou: boolean };
};

export async function compararMatricula(
  marcas: string,
  base: string,
  alvo: string,
): Promise<ResultadoComparacaoMatricula> {
  await exigirSessao();
  if (!/^\d{4}-\d{2}$/.test(base) || !/^\d{4}-\d{2}$/.test(alvo)) {
    throw new Error("Períodos inválidos");
  }
  const m = (marcas ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(m)) {
    throw new Error("Matrícula inválida");
  }

  const [aBase, aAlvo, vpBase, vpAlvo, voBase, voAlvo] = await Promise.all([
    db
      .select()
      .from(aeronaves)
      .where(and(eq(aeronaves.marcas, m), eq(aeronaves.periodo, base)))
      .limit(1),
    db
      .select()
      .from(aeronaves)
      .where(and(eq(aeronaves.marcas, m), eq(aeronaves.periodo, alvo)))
      .limit(1),
    db
      .select()
      .from(aeronaveProprietarios)
      .where(
        and(
          eq(aeronaveProprietarios.aeronaveMarcas, m),
          eq(aeronaveProprietarios.periodo, base),
        ),
      ),
    db
      .select()
      .from(aeronaveProprietarios)
      .where(
        and(
          eq(aeronaveProprietarios.aeronaveMarcas, m),
          eq(aeronaveProprietarios.periodo, alvo),
        ),
      ),
    db
      .select()
      .from(aeronaveOperadores)
      .where(
        and(
          eq(aeronaveOperadores.aeronaveMarcas, m),
          eq(aeronaveOperadores.periodo, base),
        ),
      ),
    db
      .select()
      .from(aeronaveOperadores)
      .where(
        and(
          eq(aeronaveOperadores.aeronaveMarcas, m),
          eq(aeronaveOperadores.periodo, alvo),
        ),
      ),
  ]);

  const docs = new Set<string>();
  for (const p of [...vpBase, ...vpAlvo]) docs.add(p.proprietarioDocumento);
  for (const o of [...voBase, ...voAlvo]) docs.add(o.operadorDocumento);
  const docsArr = [...docs];

  const [propBase, propAlvo, opBase, opAlvo] =
    docsArr.length > 0
      ? await Promise.all([
          db
            .select()
            .from(proprietarios)
            .where(and(inArray(proprietarios.documento, docsArr), eq(proprietarios.periodo, base))),
          db
            .select()
            .from(proprietarios)
            .where(and(inArray(proprietarios.documento, docsArr), eq(proprietarios.periodo, alvo))),
          db
            .select()
            .from(operadores)
            .where(and(inArray(operadores.documento, docsArr), eq(operadores.periodo, base))),
          db
            .select()
            .from(operadores)
            .where(and(inArray(operadores.documento, docsArr), eq(operadores.periodo, alvo))),
        ])
      : [[], [], [], []];

  type LinhaEntidade = { documento: string; nome: string; uf: string | null };
  const nomeProp = (rows: LinhaEntidade[], doc: string) => {
    const r = rows.find((x) => x.documento === doc);
    return r ? { nome: r.nome, uf: r.uf } : { nome: doc, uf: null };
  };
  const nomeOp = (rows: LinhaEntidade[], doc: string) => {
    const r = rows.find((x) => x.documento === doc);
    return r ? { nome: r.nome, uf: r.uf } : { nome: doc, uf: null };
  };

  const montarLista = (
    itens: { doc: string; percentual?: string | null }[],
    nomes: (rows: LinhaEntidade[], doc: string) => { nome: string; uf: string | null },
    periodos: LinhaEntidade[],
  ) =>
    itens
      .map((v) => {
        const info = nomes(periodos, v.doc);
        return {
          documento: v.doc,
          nome: info.nome,
          uf: info.uf,
          percentual: v.percentual ?? null,
        };
      })
      .sort((x, y) => x.documento.localeCompare(y.documento))
      .map((e) => descricaoVinculo(e))
      .join("; ") || "—";

  const proprietariosAntes = montarLista(
    vpBase.map((v) => ({ doc: v.proprietarioDocumento, percentual: v.percentual })),
    nomeProp,
    propBase,
  );
  const proprietariosDepois = montarLista(
    vpAlvo.map((v) => ({ doc: v.proprietarioDocumento, percentual: v.percentual })),
    nomeProp,
    propAlvo,
  );
  const operadoresAntes = montarLista(
    voBase.map((v) => ({ doc: v.operadorDocumento })),
    nomeOp,
    opBase,
  );
  const operadoresDepois = montarLista(
    voAlvo.map((v) => ({ doc: v.operadorDocumento })),
    nomeOp,
    opAlvo,
  );

  const campos: ResultadoComparacaoMatricula["campos"] = [];
  if (aBase[0] && aAlvo[0]) {
    const a = aBase[0];
    const b = aAlvo[0];
    for (const c of CAMPOS) {
      const chave = c.prop as keyof typeof a;
      const vBase = normalizar(a[chave], c.tipo);
      const vAlvo = normalizar(b[chave], c.tipo);
      campos.push({
        rotulo: c.rotulo,
        antes: exibir(a[chave], c.tipo),
        depois: exibir(b[chave], c.tipo),
        mudou: vBase !== vAlvo,
      });
    }
  }
  campos.push({
    rotulo: "Proprietários",
    antes: proprietariosAntes,
    depois: proprietariosDepois,
    mudou: proprietariosAntes !== proprietariosDepois,
  });
  campos.push({
    rotulo: "Operadores",
    antes: operadoresAntes,
    depois: operadoresDepois,
    mudou: operadoresAntes !== operadoresDepois,
  });

  return {
    marcas: m,
    base,
    alvo,
    existeBase: aBase.length > 0,
    existeAlvo: aAlvo.length > 0,
    campos,
    proprietarios: {
      antes: proprietariosAntes,
      depois: proprietariosDepois,
      mudou: proprietariosAntes !== proprietariosDepois,
    },
    operadores: {
      antes: operadoresAntes,
      depois: operadoresDepois,
      mudou: operadoresAntes !== operadoresDepois,
    },
  };
}

export type FiltrosComparacao = {
  campo?: string;
  fabricante?: string[];
  tipo?: "novos" | "removidos" | "alterados";
  // Filtros de aeronave (aplicam-se a ambos os períodos)
  modelo?: string[];
  situacao?: string[];
  tpMotor?: string[];
  qtMotor?: string[];
  tpPouso?: string[];
  tpCa?: string[];
  cfOperacional?: string[];
  categoria?: string[];
  tpOperacao?: string[];
  anoDe?: string;
  anoAte?: string;
};

export async function compararPeriodos(
  base: string,
  alvo: string,
  pagina = 1,
  porPagina = 50,
  filtros: FiltrosComparacao = {},
): Promise<ResultadoComparacao> {
  await exigirSessao();
  if (!/^\d{4}-\d{2}$/.test(base) || !/^\d{4}-\d{2}$/.test(alvo)) {
    throw new Error("Períodos inválidos");
  }
  // Cache memória (5min)
  const k = cacheKey(base, alvo, pagina, porPagina, filtros);
  const hit = compararCache.get(k);
  if (hit && Date.now() - hit.ts < COMPARAR_TTL) {
    return hit.data as ResultadoComparacao;
  }
  // Cache persistente no Neon (5min) - leitura ~5ms
  const fh = filtrosHashKey(base, alvo, pagina, porPagina, filtros);
  try {
    const cached = await db
      .select()
      .from(comparacoesCache)
      .where(and(eq(comparacoesCache.base, base), eq(comparacoesCache.alvo, alvo), eq(comparacoesCache.filtrosHash, fh)))
      .limit(1);
    if (cached[0] && cached[0].updatedAt) {
      const age = Date.now() - new Date(cached[0].updatedAt).getTime();
      if (age < COMPARAR_TTL) {
        const parsed = JSON.parse(cached[0].resultado) as ResultadoComparacao;
        compararCache.set(k, { data: parsed, ts: Date.now() });
        return parsed;
      }
    }
  } catch {
    // ignora erro de cache e segue para cálculo
  }

  if (base === alvo) {
    const [r] = await db
      .select({ t: sql<number>`count(*)::int` })
      .from(aeronaves)
      .where(eq(aeronaves.periodo, base));
    return {
      base,
      alvo,
      resumo: {
        novos: 0,
        removidos: 0,
        alterados: 0,
        semAlteracao: r?.t ?? 0,
      },
      estatisticas: {
        camposMaisAlterados: [],
        novosPorFabricante: [],
        removidosPorFabricante: [],
      },
      novos: [],
      removidos: [],
      alterados: [],
      pagina: 1,
      paginas: 1,
    };
  }

  // Monta cláusulas WHERE para filtros de aeronave
  const buildFilterWhere = (f: FiltrosComparacao) => {
    const p: string[] = [];
    if (f.fabricante?.length) {
      const vals = f.fabricante.map((v) => `nm_fabricante ILIKE '%${v.replace(/'/g, "''")}%'`);
      p.push(`AND (${vals.join(' OR ')})`);
    }
    if (f.situacao?.length) {
      const vals = f.situacao.map((v) => `left(coalesce(cd_interdicao, ''), 1) = '${v.replace(/'/g, "''")}'`);
      p.push(`AND (${vals.join(' OR ')})`);
    }
    if (f.modelo?.length) {
      const vals = f.modelo.map((v) => `ds_modelo ILIKE '%${v.replace(/'/g, "''")}%'`);
      p.push(`AND (${vals.join(' OR ')})`);
    }
    if (f.tpMotor?.length) {
      const vals = f.tpMotor.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND tp_motor IN (${vals.join(', ')})`);
    }
    if (f.qtMotor?.length) {
      const vals = f.qtMotor.map((v) => Number(v));
      p.push(`AND qt_motor IN (${vals.join(', ')})`);
    }
    if (f.tpPouso?.length) {
      const vals = f.tpPouso.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND tp_pouso IN (${vals.join(', ')})`);
    }
    if (f.tpCa?.length) {
      const vals = f.tpCa.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND tp_ca IN (${vals.join(', ')})`);
    }
    if (f.cfOperacional?.length) {
      const vals = f.cfOperacional.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND cf_operacional IN (${vals.join(', ')})`);
    }
    if (f.categoria?.length) {
      const vals = f.categoria.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND ds_categoria_homologacao IN (${vals.join(', ')})`);
    }
    if (f.tpOperacao?.length) {
      const vals = f.tpOperacao.map((v) => `'${v.replace(/'/g, "''")}'`);
      p.push(`AND tp_operacao IN (${vals.join(', ')})`);
    }
    if (f.anoDe) p.push(`AND nr_ano_fabricacao >= ${Number(f.anoDe)}`);
    if (f.anoAte) p.push(`AND nr_ano_fabricacao <= ${Number(f.anoAte)}`);
    return p.join(" ");
  };
  const fw = buildFilterWhere(filtros);

  const [res, resFab] = await Promise.all([
    db.execute(sql`
    WITH base AS (
      SELECT marcas, COALESCE(hash, md5(CAST(json_build_array(${sql.raw(LISTA_CAMPOS_SQL)}) AS text))) AS h
      FROM aeronaves WHERE periodo = ${base} ${sql.raw(fw)}
    ), alvo AS (
      SELECT marcas, COALESCE(hash, md5(CAST(json_build_array(${sql.raw(LISTA_CAMPOS_SQL)}) AS text))) AS h
      FROM aeronaves WHERE periodo = ${alvo} ${sql.raw(fw)}
    )
    SELECT COALESCE(base.marcas, alvo.marcas) AS marcas,
           base.marcas AS base_m,
           alvo.marcas AS alvo_m,
           (SELECT count(*)::int FROM aeronaves WHERE periodo = ${base} ${sql.raw(fw)}) AS total_base,
           (SELECT count(*)::int FROM aeronaves WHERE periodo = ${alvo} ${sql.raw(fw)}) AS total_alvo
    FROM base FULL JOIN alvo USING (marcas)
    WHERE base.h IS DISTINCT FROM alvo.h
       OR base.marcas IS NULL
       OR alvo.marcas IS NULL
  `),
    db.execute(sql`
    WITH base AS (
      SELECT marcas, nm_fabricante FROM aeronaves WHERE periodo = ${base} ${sql.raw(fw)}
    ), alvo AS (
      SELECT marcas, nm_fabricante FROM aeronaves WHERE periodo = ${alvo} ${sql.raw(fw)}
    )
    SELECT CASE WHEN base.marcas IS NULL THEN 'novo' ELSE 'removido' END AS tipo,
           COALESCE(NULLIF(TRIM(alvo.nm_fabricante), ''), NULLIF(TRIM(base.nm_fabricante), ''), 'Não informado') AS fabricante,
           count(*)::int AS n
    FROM base FULL JOIN alvo USING (marcas)
    WHERE base.marcas IS NULL OR alvo.marcas IS NULL
    GROUP BY 1, 2
    ORDER BY n DESC
  `),
  ]);

  const novosMarcas: string[] = [];
  const removidosMarcas: string[] = [];
  const alteradas: string[] = [];
  const totalBase = (res.rows[0]?.total_base as number) ?? 0;
  for (const r of res.rows) {
    const marcas = r.marcas as string;
    if (r.base_m && r.alvo_m) {
      alteradas.push(marcas);
    } else if (r.alvo_m) {
      novosMarcas.push(marcas);
    } else {
      removidosMarcas.push(marcas);
    }
  }
  novosMarcas.sort();
  removidosMarcas.sort();
  alteradas.sort();

  // Busca todos os campos para novos e removidos (para exibir tudo no final da página)
  const [modelosNovos, modelosRemovidos, opsNovos, opsRemovidos, propsNovos, propsRemovidos] = await Promise.all([
    novosMarcas.length > 0
      ? db.select().from(aeronaves).where(and(inArray(aeronaves.marcas, novosMarcas), eq(aeronaves.periodo, alvo)))
      : Promise.resolve([]),
    removidosMarcas.length > 0
      ? db.select().from(aeronaves).where(and(inArray(aeronaves.marcas, removidosMarcas), eq(aeronaves.periodo, base)))
      : Promise.resolve([]),
    novosMarcas.length > 0
      ? db
          .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
          .from(aeronaveOperadores)
          .innerJoin(operadores, and(
            eq(aeronaveOperadores.operadorDocumento, operadores.documento),
            eq(operadores.periodo, alvo),
          ))
          .where(and(
            inArray(aeronaveOperadores.aeronaveMarcas, novosMarcas),
            eq(aeronaveOperadores.periodo, alvo),
          ))
      : Promise.resolve([]),
    removidosMarcas.length > 0
      ? db
          .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
          .from(aeronaveOperadores)
          .innerJoin(operadores, and(
            eq(aeronaveOperadores.operadorDocumento, operadores.documento),
            eq(operadores.periodo, base),
          ))
          .where(and(
            inArray(aeronaveOperadores.aeronaveMarcas, removidosMarcas),
            eq(aeronaveOperadores.periodo, base),
          ))
      : Promise.resolve([]),
    novosMarcas.length > 0
      ? db
          .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
          .from(aeronaveProprietarios)
          .innerJoin(proprietarios, and(
            eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento),
            eq(proprietarios.periodo, alvo),
          ))
          .where(and(
            inArray(aeronaveProprietarios.aeronaveMarcas, novosMarcas),
            eq(aeronaveProprietarios.periodo, alvo),
          ))
      : Promise.resolve([]),
    removidosMarcas.length > 0
      ? db
          .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
          .from(aeronaveProprietarios)
          .innerJoin(proprietarios, and(
            eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento),
            eq(proprietarios.periodo, base),
          ))
          .where(and(
            inArray(aeronaveProprietarios.aeronaveMarcas, removidosMarcas),
            eq(aeronaveProprietarios.periodo, base),
          ))
      : Promise.resolve([]),
  ]);
  const mapaModelosNovos = new Map(modelosNovos.map((r) => [r.marcas, r]));
  const mapaModelosRemovidos = new Map(modelosRemovidos.map((r) => [r.marcas, r]));
  const mapaOpsNovos = new Map<string, string[]>();
  for (const r of opsNovos) {
    if (!mapaOpsNovos.has(r.aeronaveMarcas)) mapaOpsNovos.set(r.aeronaveMarcas, []);
    mapaOpsNovos.get(r.aeronaveMarcas)!.push(r.nome);
  }
  const mapaOpsRemovidos = new Map<string, string[]>();
  for (const r of opsRemovidos) {
    if (!mapaOpsRemovidos.has(r.aeronaveMarcas)) mapaOpsRemovidos.set(r.aeronaveMarcas, []);
    mapaOpsRemovidos.get(r.aeronaveMarcas)!.push(r.nome);
  }
  const mapaPropsNovos = new Map<string, string[]>();
  for (const r of propsNovos) {
    if (!mapaPropsNovos.has(r.aeronaveMarcas)) mapaPropsNovos.set(r.aeronaveMarcas, []);
    mapaPropsNovos.get(r.aeronaveMarcas)!.push(r.nome);
  }
  const mapaPropsRemovidos = new Map<string, string[]>();
  for (const r of propsRemovidos) {
    if (!mapaPropsRemovidos.has(r.aeronaveMarcas)) mapaPropsRemovidos.set(r.aeronaveMarcas, []);
    mapaPropsRemovidos.get(r.aeronaveMarcas)!.push(r.nome);
  }
  const novos = novosMarcas.map((m) => {
    const r = mapaModelosNovos.get(m);
    return {
      marcas: m,
      periodo: r?.periodo ?? alvo,
      modelo: r?.dsModelo ?? null,
      tipoIcao: r?.cdTipoIcao ?? null,
      tipoIcaoNome: r?.dsTipoIcaoNome ?? null,
      fabricante: r?.nmFabricante ?? null,
      anoFabricacao: r?.nrAnoFabricacao ?? null,
      nrCertMatricula: r?.nrCertMatricula ?? null,
      nrSerie: r?.nrSerie ?? null,
      cdTipo: r?.cdTipo ?? null,
      cdCls: r?.cdCls ?? null,
      nrPmd: r?.nrPmd != null ? String(r.nrPmd) : null,
      nrTripulacaoMin: r?.nrTripulacaoMin ?? null,
      nrPassageirosMax: r?.nrPassageirosMax ?? null,
      nrAssentos: r?.nrAssentos ?? null,
      dtValidadeCva: r?.dtValidadeCva ?? null,
      dtValidadeCa: r?.dtValidadeCa ?? null,
      dtCanc: r?.dtCanc ?? null,
      dsMotivoCanc: r?.dsMotivoCanc ?? null,
      cdInterdicao: r?.cdInterdicao ?? null,
      dsGravame: r?.dsGravame ?? null,
      dtMatricula: r?.dtMatricula ?? null,
      tpMotor: r?.tpMotor ?? null,
      qtMotor: r?.qtMotor ?? null,
      tpPouso: r?.tpPouso ?? null,
      tpCa: r?.tpCa ?? null,
      cdPropositoCave: r?.cdPropositoCave ?? null,
      cfOperacional: r?.cfOperacional ?? null,
      dsCategoriaHomologacao: r?.dsCategoriaHomologacao ?? null,
      tpOperacao: r?.tpOperacao ?? null,
      operadores: mapaOpsNovos.get(m) ?? [],
      proprietarios: mapaPropsNovos.get(m) ?? [],
    };
  });
  const removidos = removidosMarcas.map((m) => {
    const r = mapaModelosRemovidos.get(m);
    return {
      marcas: m,
      periodo: r?.periodo ?? base,
      modelo: r?.dsModelo ?? null,
      tipoIcao: r?.cdTipoIcao ?? null,
      tipoIcaoNome: r?.dsTipoIcaoNome ?? null,
      fabricante: r?.nmFabricante ?? null,
      anoFabricacao: r?.nrAnoFabricacao ?? null,
      nrCertMatricula: r?.nrCertMatricula ?? null,
      nrSerie: r?.nrSerie ?? null,
      cdTipo: r?.cdTipo ?? null,
      cdCls: r?.cdCls ?? null,
      nrPmd: r?.nrPmd != null ? String(r.nrPmd) : null,
      nrTripulacaoMin: r?.nrTripulacaoMin ?? null,
      nrPassageirosMax: r?.nrPassageirosMax ?? null,
      nrAssentos: r?.nrAssentos ?? null,
      dtValidadeCva: r?.dtValidadeCva ?? null,
      dtValidadeCa: r?.dtValidadeCa ?? null,
      dtCanc: r?.dtCanc ?? null,
      dsMotivoCanc: r?.dsMotivoCanc ?? null,
      cdInterdicao: r?.cdInterdicao ?? null,
      dsGravame: r?.dsGravame ?? null,
      dtMatricula: r?.dtMatricula ?? null,
      tpMotor: r?.tpMotor ?? null,
      qtMotor: r?.qtMotor ?? null,
      tpPouso: r?.tpPouso ?? null,
      tpCa: r?.tpCa ?? null,
      cdPropositoCave: r?.cdPropositoCave ?? null,
      cfOperacional: r?.cfOperacional ?? null,
      dsCategoriaHomologacao: r?.dsCategoriaHomologacao ?? null,
      tpOperacao: r?.tpOperacao ?? null,
      operadores: mapaOpsRemovidos.get(m) ?? [],
      proprietarios: mapaPropsRemovidos.get(m) ?? [],
    };
  });

  // Otimização: quando há filtro por campo específico (ex: Status da Aeronave),
  // busca apenas as marcas onde a coluna correspondente realmente mudou,
  // evitando fetch de 1500+ registros e comparações em memória.
  let alteradasParaBuscar = alteradas;
  if (filtros.campo && !filtros.fabricante?.length && alteradas.length > 0) {
    const campoInfo = CAMPOS.find((c) => c.rotulo === filtros.campo);
    if (campoInfo) {
      try {
        const col = campoInfo.coluna;
        // Whitelist garante que col é seguro (vem de CAMPOS)
        const rCampo = await db.execute(sql`
          SELECT b.marcas as marcas
          FROM aeronaves b
          JOIN aeronaves a ON a.marcas = b.marcas
          WHERE b.periodo = ${base} AND a.periodo = ${alvo}
            AND b.marcas IN ${sql.raw(`(${alteradas.map((m) => `'${m.replace(/'/g, "''")}'`).join(",")})`)}
            AND b.${sql.raw(col)} IS DISTINCT FROM a.${sql.raw(col)}
        `);
        const marcasCampo = new Set((rCampo.rows as { marcas: string }[]).map((r) => r.marcas));
        // Se encontrou, usa apenas essas; senão mantém todas (fallback)
        if (marcasCampo.size > 0) {
          alteradasParaBuscar = alteradas.filter((m) => marcasCampo.has(m));
        } else {
          alteradasParaBuscar = [];
        }
      } catch {
        // fallback: busca todas
        alteradasParaBuscar = alteradas;
      }
    }
  }

  // Paginação antes do fetch para não buscar 1500+ registros quando só 50 são exibidos
  // Só pagina quando não há filtros que precisam do conjunto completo (fabricante/campo já tratado)
  const totalParaBuscar = alteradasParaBuscar.length;
  const precisaConjuntoCompleto = !!(filtros.fabricante?.length || filtros.tipo);
  const paginasCalc = precisaConjuntoCompleto ? 1 : Math.max(1, Math.ceil(totalParaBuscar / porPagina));
  const paginaCalc = Math.min(Math.max(1, pagina), paginasCalc);
  const alteradasPagina = precisaConjuntoCompleto
    ? alteradasParaBuscar
    : alteradasParaBuscar.slice((paginaCalc - 1) * porPagina, paginaCalc * porPagina);

  // Busca leve para estatísticas (2 queries com IN 1500, sem vinculos) - para não bloquear display
  let linhasBaseAll: (typeof aeronaves.$inferSelect)[] = [];
  let linhasAlvoAll: (typeof aeronaves.$inferSelect)[] = [];
  if (alteradasParaBuscar.length > 0) {
    [linhasBaseAll, linhasAlvoAll] = await Promise.all([
      db.select().from(aeronaves).where(and(inArray(aeronaves.marcas, alteradasParaBuscar), eq(aeronaves.periodo, base))),
      db.select().from(aeronaves).where(and(inArray(aeronaves.marcas, alteradasParaBuscar), eq(aeronaves.periodo, alvo))),
    ]);
  }
  const mapBaseAll = new Map(linhasBaseAll.map((l) => [l.marcas, l]));
  const mapAlvoAll = new Map(linhasAlvoAll.map((l) => [l.marcas, l]));
  const contagemEstat = new Map<string, number>();
  const valoresEstat = new Map<string, Map<string, number>>();
  for (const m of alteradasParaBuscar) {
    const a = mapBaseAll.get(m);
    const b = mapAlvoAll.get(m);
    if (!a || !b) continue;
    for (const c of CAMPOS) {
      const chave = c.prop as keyof typeof a;
      const vBase = normalizar(a[chave], c.tipo);
      const vAlvo = normalizar(b[chave], c.tipo);
      if (vBase !== vAlvo) {
        contagemEstat.set(c.rotulo, (contagemEstat.get(c.rotulo) ?? 0) + 1);
        if (!valoresEstat.has(c.rotulo)) valoresEstat.set(c.rotulo, new Map());
        const vm = valoresEstat.get(c.rotulo)!;
        const key = String(a[chave] ?? "");
        vm.set(key, (vm.get(key) ?? 0) + 1);
      }
    }
  }

  let alterados: DiferencaAeronave[] = [];
  if (alteradasPagina.length > 0) {
    const precisaVinculos = !filtros.campo || !CAMPOS.some((c) => c.rotulo === filtros.campo);
    const [linhasBase, linhasAlvo, propBase, propAlvo, opBase, opAlvo] =
      await Promise.all([
        db
          .select()
          .from(aeronaves)
          .where(and(inArray(aeronaves.marcas, alteradasPagina), eq(aeronaves.periodo, base))),
        db
          .select()
          .from(aeronaves)
          .where(and(inArray(aeronaves.marcas, alteradasPagina), eq(aeronaves.periodo, alvo))),
        precisaVinculos
          ? db
              .select()
              .from(aeronaveProprietarios)
              .where(
                and(
                  inArray(aeronaveProprietarios.aeronaveMarcas, alteradasPagina),
                  eq(aeronaveProprietarios.periodo, base),
                ),
              )
          : Promise.resolve([] as (typeof aeronaveProprietarios.$inferSelect)[]),
        precisaVinculos
          ? db
              .select()
              .from(aeronaveProprietarios)
              .where(
                and(
                  inArray(aeronaveProprietarios.aeronaveMarcas, alteradasPagina),
                  eq(aeronaveProprietarios.periodo, alvo),
                ),
              )
          : Promise.resolve([] as (typeof aeronaveProprietarios.$inferSelect)[]),
        precisaVinculos
          ? db
              .select()
              .from(aeronaveOperadores)
              .where(
                and(
                  inArray(aeronaveOperadores.aeronaveMarcas, alteradasPagina),
                  eq(aeronaveOperadores.periodo, base),
                ),
              )
          : Promise.resolve([] as (typeof aeronaveOperadores.$inferSelect)[]),
        precisaVinculos
          ? db
              .select()
              .from(aeronaveOperadores)
              .where(
                and(
                  inArray(aeronaveOperadores.aeronaveMarcas, alteradasPagina),
                  eq(aeronaveOperadores.periodo, alvo),
                ),
              )
          : Promise.resolve([] as (typeof aeronaveOperadores.$inferSelect)[]),
      ]);

    const docs = new Set<string>();
    for (const p of [...propBase, ...propAlvo]) docs.add(p.proprietarioDocumento);
    for (const o of [...opBase, ...opAlvo]) docs.add(o.operadorDocumento);
    const docsArr = [...docs];

    const [proprietariosBase, proprietariosAlvo, operadoresBase, operadoresAlvo] =
      docsArr.length > 0 && precisaVinculos
        ? await Promise.all([
            db
              .select()
              .from(proprietarios)
              .where(and(inArray(proprietarios.documento, docsArr), eq(proprietarios.periodo, base))),
            db
              .select()
              .from(proprietarios)
              .where(and(inArray(proprietarios.documento, docsArr), eq(proprietarios.periodo, alvo))),
            db
              .select()
              .from(operadores)
              .where(and(inArray(operadores.documento, docsArr), eq(operadores.periodo, base))),
            db
              .select()
              .from(operadores)
              .where(and(inArray(operadores.documento, docsArr), eq(operadores.periodo, alvo))),
          ])
        : [[], [], [], []] as unknown as [
            (typeof proprietarios.$inferSelect)[],
            (typeof proprietarios.$inferSelect)[],
            (typeof operadores.$inferSelect)[],
            (typeof operadores.$inferSelect)[],
          ];

    const mapProprietarios = (rows: typeof proprietariosBase) => {
      const m = new Map<string, { nome: string; uf: string | null }>();
      for (const p of rows) m.set(p.documento, { nome: p.nome, uf: p.uf });
      return m;
    };
    const mapOperadores = (rows: typeof operadoresBase) => {
      const m = new Map<string, { nome: string; uf: string | null }>();
      for (const o of rows) m.set(o.documento, { nome: o.nome, uf: o.uf });
      return m;
    };

    const nomePropBase = mapProprietarios(proprietariosBase);
    const nomePropAlvo = mapProprietarios(proprietariosAlvo);
    const nomeOpBase = mapOperadores(operadoresBase);
    const nomeOpAlvo = mapOperadores(operadoresAlvo);

    const montarProp = (
      linhas: typeof propBase,
      nomes: Map<string, { nome: string; uf: string | null }>,
    ) => {
      const porMarcas = new Map<string, Map<string, EntidadeVinculo>>();
      for (const l of linhas) {
        if (!porMarcas.has(l.aeronaveMarcas)) porMarcas.set(l.aeronaveMarcas, new Map());
        const info = nomes.get(l.proprietarioDocumento);
        porMarcas
          .get(l.aeronaveMarcas)!
          .set(l.proprietarioDocumento, {
            documento: l.proprietarioDocumento,
            nome: info?.nome ?? l.proprietarioDocumento,
            uf: info?.uf ?? null,
            percentual: l.percentual,
          });
      }
      return porMarcas;
    };

    const montarOp = (
      linhas: typeof opBase,
      nomes: Map<string, { nome: string; uf: string | null }>,
    ) => {
      const porMarcas = new Map<string, Map<string, EntidadeVinculo>>();
      for (const l of linhas) {
        if (!porMarcas.has(l.aeronaveMarcas)) porMarcas.set(l.aeronaveMarcas, new Map());
        const info = nomes.get(l.operadorDocumento);
        porMarcas
          .get(l.aeronaveMarcas)!
          .set(l.operadorDocumento, {
            documento: l.operadorDocumento,
            nome: info?.nome ?? l.operadorDocumento,
            uf: info?.uf ?? null,
          });
      }
      return porMarcas;
    };

    const vpB = montarProp(propBase, nomePropBase);
    const vpA = montarProp(propAlvo, nomePropAlvo);
    const voB = montarOp(opBase, nomeOpBase);
    const voA = montarOp(opAlvo, nomeOpAlvo);

    const linhasBaseMap = new Map(linhasBase.map((l) => [l.marcas, l]));
    const linhasAlvoMap = new Map(linhasAlvo.map((l) => [l.marcas, l]));

    alterados = alteradasPagina.map((marcas) => {
      const a = linhasBaseMap.get(marcas)!;
      const b = linhasAlvoMap.get(marcas)!;
      const campos: DiferencaCampo[] = [];
      for (const c of CAMPOS) {
        const chave = c.prop as keyof typeof a;
        const vBase = normalizar(a[chave], c.tipo);
        const vAlvo = normalizar(b[chave], c.tipo);
        if (vBase !== vAlvo) {
          campos.push({
            campo: c.rotulo,
            antes: exibir(a[chave], c.tipo),
            depois: exibir(b[chave], c.tipo),
          });
        }
      }
      const proprietariosDiff = compararVinculos(
        vpB.get(marcas) ?? new Map(),
        vpA.get(marcas) ?? new Map(),
      );
      if (proprietariosDiff.adicionados.length || proprietariosDiff.removidos.length || proprietariosDiff.alterados.length) {
        const partesAntes: string[] = [];
        const partesDepois: string[] = [];
        if (proprietariosDiff.removidos.length) partesAntes.push(`Removidos: ${proprietariosDiff.removidos.join("; ")}`);
        if (proprietariosDiff.adicionados.length) partesDepois.push(`Adicionados: ${proprietariosDiff.adicionados.join("; ")}`);
        if (proprietariosDiff.alterados.length) {
          for (const alt of proprietariosDiff.alterados) {
            partesAntes.push(alt.antes);
            partesDepois.push(alt.depois);
          }
        }
        campos.push({
          campo: "Proprietários",
          antes: partesAntes.length ? partesAntes.join("; ") : "—",
          depois: partesDepois.length ? partesDepois.join("; ") : "—",
        });
      }
      const operadoresDiff = compararVinculos(
        voB.get(marcas) ?? new Map(),
        voA.get(marcas) ?? new Map(),
      );
      if (operadoresDiff.adicionados.length || operadoresDiff.removidos.length || operadoresDiff.alterados.length) {
        const partesAntes: string[] = [];
        const partesDepois: string[] = [];
        if (operadoresDiff.removidos.length) partesAntes.push(`Removidos: ${operadoresDiff.removidos.join("; ")}`);
        if (operadoresDiff.adicionados.length) partesDepois.push(`Adicionados: ${operadoresDiff.adicionados.join("; ")}`);
        if (operadoresDiff.alterados.length) {
          for (const alt of operadoresDiff.alterados) {
            partesAntes.push(alt.antes);
            partesDepois.push(alt.depois);
          }
        }
        campos.push({
          campo: "Operadores",
          antes: partesAntes.length ? partesAntes.join("; ") : "—",
          depois: partesDepois.length ? partesDepois.join("; ") : "—",
        });
      }
      return {
        marcas,
        modelo: b.dsModelo ?? null,
        tipoIcao: b.cdTipoIcao ?? null,
        tipoIcaoNome: (b as unknown as { dsTipoIcaoNome?: string | null }).dsTipoIcaoNome ?? null,
        anoFabricacao: b.nrAnoFabricacao ?? null,
        campos,
        proprietarios: proprietariosDiff,
        operadores: operadoresDiff,
      };
    });
  }

  // Aplica filtros de drill-down quando clicado nos cards de estatísticas
  let novosFiltrados = novos;
  let removidosFiltrados = removidos;
  let alteradosFiltrados = alterados;

  // Filtro por campo específico (ex: Status da Aeronave)
  if (filtros.campo) {
    alteradosFiltrados = alterados.filter((a) =>
      a.campos.some((c) => c.campo === filtros.campo),
    );
  }

  // Filtro por tipo (novos, removidos, alterados) — funciona com ou sem fabricante
  if (filtros.tipo === "novos" && novos.length > 0) {
    if (filtros.fabricante?.length) {
      const novosMarcasF = novos.map((n) => n.marcas);
      const rows = await db
        .select({ marcas: aeronaves.marcas, dsModelo: aeronaves.dsModelo, cdTipoIcao: aeronaves.cdTipoIcao, dsTipoIcaoNome: aeronaves.dsTipoIcaoNome, nrAnoFabricacao: aeronaves.nrAnoFabricacao, nmFabricante: aeronaves.nmFabricante })
        .from(aeronaves)
        .where(and(
          inArray(aeronaves.marcas, novosMarcasF),
          eq(aeronaves.periodo, alvo),
          or(...(filtros.fabricante ?? []).map(f => ilike(aeronaves.nmFabricante, `%${f}%`))),
        ));
      const marcasNovosF = rows.map((r) => r.marcas);
      const opsNovosF = marcasNovosF.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
            .from(aeronaveOperadores)
            .innerJoin(operadores, and(eq(aeronaveOperadores.operadorDocumento, operadores.documento), eq(operadores.periodo, alvo)))
            .where(and(inArray(aeronaveOperadores.aeronaveMarcas, marcasNovosF), eq(aeronaveOperadores.periodo, alvo)))
        : Promise.resolve([]);
      const opsNovosRows = await opsNovosF;
      const mapaOpsNF = new Map<string, string[]>();
      for (const r of opsNovosRows) {
        if (!mapaOpsNF.has(r.aeronaveMarcas)) mapaOpsNF.set(r.aeronaveMarcas, []);
        mapaOpsNF.get(r.aeronaveMarcas)!.push(r.nome);
      }
      const propsNovosF = marcasNovosF.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
            .from(aeronaveProprietarios)
            .innerJoin(proprietarios, and(eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento), eq(proprietarios.periodo, alvo)))
            .where(and(inArray(aeronaveProprietarios.aeronaveMarcas, marcasNovosF), eq(aeronaveProprietarios.periodo, alvo)))
        : Promise.resolve([]);
      const propsNovosRows = await propsNovosF;
      const mapaPropsNF = new Map<string, string[]>();
      for (const r of propsNovosRows) {
        if (!mapaPropsNF.has(r.aeronaveMarcas)) mapaPropsNF.set(r.aeronaveMarcas, []);
        mapaPropsNF.get(r.aeronaveMarcas)!.push(r.nome);
      }
      // @ts-ignore
      novosFiltrados = rows.map((r) => ({ marcas: r.marcas, periodo: alvo, modelo: r.dsModelo ?? null, tipoIcao: r.cdTipoIcao ?? null, tipoIcaoNome: (r as unknown as { dsTipoIcaoNome: string | null }).dsTipoIcaoNome ?? null, fabricante: r.nmFabricante ?? null, operadores: mapaOpsNF.get(r.marcas) ?? [], proprietarios: mapaPropsNF.get(r.marcas) ?? [], anoFabricacao: r.nrAnoFabricacao ?? null }) as unknown as NovoDetalhado[]);
    }
    // Esconde removidos e alterados quando visualizando apenas novos
    removidosFiltrados = [];
    alteradosFiltrados = [];
  } else if (filtros.tipo === "removidos" && removidos.length > 0) {
    if (filtros.fabricante?.length) {
      const removidosMarcasF = removidos.map((r) => r.marcas);
      const rowsR = await db
        .select({ marcas: aeronaves.marcas, dsModelo: aeronaves.dsModelo, cdTipoIcao: aeronaves.cdTipoIcao, dsTipoIcaoNome: aeronaves.dsTipoIcaoNome, nrAnoFabricacao: aeronaves.nrAnoFabricacao, nmFabricante: aeronaves.nmFabricante })
        .from(aeronaves)
        .where(and(
          inArray(aeronaves.marcas, removidosMarcasF),
          eq(aeronaves.periodo, base),
          or(...(filtros.fabricante ?? []).map(f => ilike(aeronaves.nmFabricante, `%${f}%`))),
        ));
      const marcasRemF = rowsR.map((r) => r.marcas);
      const opsRemF = marcasRemF.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
            .from(aeronaveOperadores)
            .innerJoin(operadores, and(eq(aeronaveOperadores.operadorDocumento, operadores.documento), eq(operadores.periodo, base)))
            .where(and(inArray(aeronaveOperadores.aeronaveMarcas, marcasRemF), eq(aeronaveOperadores.periodo, base)))
        : Promise.resolve([]);
      const opsRemRows = await opsRemF;
      const mapaOpsRF = new Map<string, string[]>();
      for (const r of opsRemRows) {
        if (!mapaOpsRF.has(r.aeronaveMarcas)) mapaOpsRF.set(r.aeronaveMarcas, []);
        mapaOpsRF.get(r.aeronaveMarcas)!.push(r.nome);
      }
      const propsRemF = marcasRemF.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
            .from(aeronaveProprietarios)
            .innerJoin(proprietarios, and(eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento), eq(proprietarios.periodo, base)))
            .where(and(inArray(aeronaveProprietarios.aeronaveMarcas, marcasRemF), eq(aeronaveProprietarios.periodo, base)))
        : Promise.resolve([]);
      const propsRemRows = await propsRemF;
      const mapaPropsRF = new Map<string, string[]>();
      for (const r of propsRemRows) {
        if (!mapaPropsRF.has(r.aeronaveMarcas)) mapaPropsRF.set(r.aeronaveMarcas, []);
        mapaPropsRF.get(r.aeronaveMarcas)!.push(r.nome);
      }
      // @ts-ignore
      removidosFiltrados = rowsR.map((r) => ({ marcas: r.marcas, periodo: base, modelo: r.dsModelo ?? null, tipoIcao: r.cdTipoIcao ?? null, tipoIcaoNome: (r as unknown as { dsTipoIcaoNome: string | null }).dsTipoIcaoNome ?? null, fabricante: r.nmFabricante ?? null, operadores: mapaOpsRF.get(r.marcas) ?? [], proprietarios: mapaPropsRF.get(r.marcas) ?? [], anoFabricacao: r.nrAnoFabricacao ?? null }) as unknown as NovoDetalhado);
    }
    novosFiltrados = [];
    alteradosFiltrados = [];
  } else if (filtros.tipo === "alterados" && !filtros.fabricante?.length) {
    // Tipo alterados sem fabricante — mantém a lógica original de campos
    novosFiltrados = [];
    removidosFiltrados = [];
  } else if (filtros.tipo === "alterados" && filtros.fabricante?.length) {
    const allMarcas = alterados.map((a) => a.marcas);
    if (allMarcas.length > 0) {
      const rows = await db
        .select({ marcas: aeronaves.marcas })
        .from(aeronaves)
        .where(and(
          inArray(aeronaves.marcas, allMarcas),
          eq(aeronaves.periodo, alvo),
          or(...(filtros.fabricante ?? []).map(f => ilike(aeronaves.nmFabricante, `%${f}%`))),
        ));
      const marcasFab = new Set(rows.map((r) => r.marcas));
      alteradosFiltrados = alterados.filter((a) => marcasFab.has(a.marcas));
    }
    novosFiltrados = [];
    removidosFiltrados = [];
  }

  // Filtro por fabricante sem tipo definido (mantém compatibilidade)
  if (filtros.fabricante?.length && !filtros.tipo) {
    const fabs = filtros.fabricante;
    if (novos.length > 0) {
      const novosMarcas = novos.map((n) => n.marcas);
      const rows = await db
        .select({ marcas: aeronaves.marcas, dsModelo: aeronaves.dsModelo, cdTipoIcao: aeronaves.cdTipoIcao, dsTipoIcaoNome: aeronaves.dsTipoIcaoNome, nrAnoFabricacao: aeronaves.nrAnoFabricacao, nmFabricante: aeronaves.nmFabricante })
        .from(aeronaves)
        .where(and(
          inArray(aeronaves.marcas, novosMarcas),
          eq(aeronaves.periodo, alvo),
          or(...fabs.map(f => ilike(aeronaves.nmFabricante, `%${f}%`))),
        ));
      const marcasNFab = rows.map((r) => r.marcas);
      const opsNFab = marcasNFab.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
            .from(aeronaveOperadores)
            .innerJoin(operadores, and(eq(aeronaveOperadores.operadorDocumento, operadores.documento), eq(operadores.periodo, alvo)))
            .where(and(inArray(aeronaveOperadores.aeronaveMarcas, marcasNFab), eq(aeronaveOperadores.periodo, alvo)))
        : Promise.resolve([]);
      const opsNFabRows = await opsNFab;
      const mapaOpsNFab = new Map<string, string[]>();
      for (const r of opsNFabRows) {
        if (!mapaOpsNFab.has(r.aeronaveMarcas)) mapaOpsNFab.set(r.aeronaveMarcas, []);
        mapaOpsNFab.get(r.aeronaveMarcas)!.push(r.nome);
      }
      const propsNFab = marcasNFab.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
            .from(aeronaveProprietarios)
            .innerJoin(proprietarios, and(eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento), eq(proprietarios.periodo, alvo)))
            .where(and(inArray(aeronaveProprietarios.aeronaveMarcas, marcasNFab), eq(aeronaveProprietarios.periodo, alvo)))
        : Promise.resolve([]);
      const propsNFabRows = await propsNFab;
      const mapaPropsNFab = new Map<string, string[]>();
      for (const r of propsNFabRows) {
        if (!mapaPropsNFab.has(r.aeronaveMarcas)) mapaPropsNFab.set(r.aeronaveMarcas, []);
        mapaPropsNFab.get(r.aeronaveMarcas)!.push(r.nome);
      // @ts-ignore
      }
      novosFiltrados = rows.map((r) => ({ marcas: r.marcas, periodo: alvo, modelo: r.dsModelo ?? null, tipoIcao: r.cdTipoIcao ?? null, tipoIcaoNome: (r as unknown as { dsTipoIcaoNome: string | null }).dsTipoIcaoNome ?? null, fabricante: r.nmFabricante ?? null, operadores: mapaOpsNFab.get(r.marcas) ?? [], proprietarios: mapaPropsNFab.get(r.marcas) ?? [], anoFabricacao: r.nrAnoFabricacao ?? null }));
    }
    if (removidos.length > 0) {
      const removidosMarcas = removidos.map((r) => r.marcas);
      const rowsR = await db
        .select({ marcas: aeronaves.marcas, dsModelo: aeronaves.dsModelo, cdTipoIcao: aeronaves.cdTipoIcao, dsTipoIcaoNome: aeronaves.dsTipoIcaoNome, nrAnoFabricacao: aeronaves.nrAnoFabricacao, nmFabricante: aeronaves.nmFabricante })
        .from(aeronaves)
        .where(and(
          inArray(aeronaves.marcas, removidosMarcas),
          eq(aeronaves.periodo, base),
          or(...fabs.map(f => ilike(aeronaves.nmFabricante, `%${f}%`))),
        ));
      const marcasRFab = rowsR.map((r) => r.marcas);
      const opsRFab = marcasRFab.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveOperadores.aeronaveMarcas, nome: operadores.nome })
            .from(aeronaveOperadores)
            .innerJoin(operadores, and(eq(aeronaveOperadores.operadorDocumento, operadores.documento), eq(operadores.periodo, base)))
            .where(and(inArray(aeronaveOperadores.aeronaveMarcas, marcasRFab), eq(aeronaveOperadores.periodo, base)))
        : Promise.resolve([]);
      const opsRFabRows = await opsRFab;
      const mapaOpsRFab = new Map<string, string[]>();
      for (const r of opsRFabRows) {
        if (!mapaOpsRFab.has(r.aeronaveMarcas)) mapaOpsRFab.set(r.aeronaveMarcas, []);
        mapaOpsRFab.get(r.aeronaveMarcas)!.push(r.nome);
      }
      const propsRFab = marcasRFab.length > 0
        ? db
            .select({ aeronaveMarcas: aeronaveProprietarios.aeronaveMarcas, nome: proprietarios.nome })
            .from(aeronaveProprietarios)
            .innerJoin(proprietarios, and(eq(aeronaveProprietarios.proprietarioDocumento, proprietarios.documento), eq(proprietarios.periodo, base)))
            .where(and(inArray(aeronaveProprietarios.aeronaveMarcas, marcasRFab), eq(aeronaveProprietarios.periodo, base)))
        : Promise.resolve([]);
      const propsRFabRows = await propsRFab;
      const mapaPropsRFab = new Map<string, string[]>();
      for (const r of propsRFabRows) {
        if (!mapaPropsRFab.has(r.aeronaveMarcas)) mapaPropsRFab.set(r.aeronaveMarcas, []);
      // @ts-ignore
        mapaPropsRFab.get(r.aeronaveMarcas)!.push(r.nome);
      }
      removidosFiltrados = rowsR.map((r) => ({ marcas: r.marcas, periodo: base, modelo: r.dsModelo ?? null, tipoIcao: r.cdTipoIcao ?? null, tipoIcaoNome: (r as unknown as { dsTipoIcaoNome: string | null }).dsTipoIcaoNome ?? null, fabricante: r.nmFabricante ?? null, operadores: mapaOpsRFab.get(r.marcas) ?? [], proprietarios: mapaPropsRFab.get(r.marcas) ?? [], anoFabricacao: r.nrAnoFabricacao ?? null }));
    }
  }

  // Usa total e paginas pré-calculados (alterados já paginado, evita double slice)
  // Se precisaConjuntoCompleto, total é totalParaBuscar, senão também totalParaBuscar (já filtrado por campo)
  // Para caso com fabricante/tipo, total será recalculado após filtros abaixo, então mantém lógica original para esses
  let total = precisaConjuntoCompleto ? alteradosFiltrados.length : totalParaBuscar;
  let paginas = precisaConjuntoCompleto ? (filtros.tipo ? 1 : Math.max(1, Math.ceil(total / porPagina))) : paginasCalc;
  let fatia: typeof alterados = precisaConjuntoCompleto
    ? (filtros.tipo ? alteradosFiltrados : alteradosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina))
    : alterados; // já paginado

  // Para estatísticas, usa contagem pré-calculada de todas (sem vinculos) quando não há filtros complexos
  // Se precisaConjuntoCompleto, recalcula a partir de alterados (que é completo nesse caso)
  let contagemCampos: Map<string, number>;
  let valoresCampos: Map<string, Map<string, number>>;
  if (!precisaConjuntoCompleto) {
    contagemCampos = contagemEstat;
    valoresCampos = valoresEstat;
  } else {
    contagemCampos = new Map<string, number>();
    valoresCampos = new Map<string, Map<string, number>>();
    for (const a of alterados) {
      for (const c of a.campos) {
        contagemCampos.set(c.campo, (contagemCampos.get(c.campo) ?? 0) + 1);
        if (!valoresCampos.has(c.campo)) valoresCampos.set(c.campo, new Map());
        const vMap = valoresCampos.get(c.campo)!;
        vMap.set(c.antes, (vMap.get(c.antes) ?? 0) + 1);
      }
    }
  }
  const camposMaisAlterados = [...contagemCampos.entries()]
    .map(([rotulo, quantidade]) => {
      const vMap = valoresCampos.get(rotulo);
      let valorMaisComum = "";
      if (vMap && vMap.size > 0) {
        valorMaisComum = [...vMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
      return { rotulo, quantidade, valorMaisComum };
    })
    .sort((x, y) => y.quantidade - x.quantidade)
    .slice(0, 8);

  const novosPorFabricante = resFab.rows
    .filter((r) => r.tipo === "novo")
    .slice(0, 6)
    .map((r) => ({ fabricante: r.fabricante as string, quantidade: r.n as number }));
  const removidosPorFabricante = resFab.rows
    .filter((r) => r.tipo === "removido")
    .slice(0, 6)
    .map((r) => ({ fabricante: r.fabricante as string, quantidade: r.n as number }));

  const out: ResultadoComparacao = {
    base,
    alvo,
    resumo: {
      novos: novos.length,
      removidos: removidos.length,
      alterados: total,
      semAlteracao: totalBase - removidos.length - total,
    },
    estatisticas: {
      camposMaisAlterados,
      novosPorFabricante,
      removidosPorFabricante,
    },
    novos: novosFiltrados,
    removidos: removidosFiltrados,
    alterados: fatia,
    pagina,
    paginas,
  };
  compararCache.set(k, { data: out, ts: Date.now() });
  // Limita tamanho do cache memória
  if (compararCache.size > 50) {
    const first = compararCache.keys().next().value;
    if (first) compararCache.delete(first);
  }
  // Persiste no Neon para próximos pods/instâncias (fire-and-forget, ~5ms)
  try {
    await db
      .insert(comparacoesCache)
      .values({
        base,
        alvo,
        filtrosHash: fh,
        filtros: JSON.stringify({ pagina, porPagina, ...filtros }),
        resultado: JSON.stringify(out),
      })
      .onConflictDoUpdate({
        target: [comparacoesCache.base, comparacoesCache.alvo, comparacoesCache.filtrosHash],
        set: { resultado: JSON.stringify(out), filtros: JSON.stringify({ pagina, porPagina, ...filtros }), updatedAt: new Date() },
      });
  } catch {
    // ignora erro de cache
  }
  return out;
}