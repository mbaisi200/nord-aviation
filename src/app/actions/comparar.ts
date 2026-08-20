"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
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
  { coluna: "cd_interdicao", prop: "cdInterdicao", rotulo: "Interdição", tipo: "text" },
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
  campos: DiferencaCampo[];
  proprietarios: DiferencaProprietarios;
  operadores: DiferencaOperadores;
};

export type EstatisticasComparacao = {
  camposMaisAlterados: { rotulo: string; quantidade: number }[];
  novosPorFabricante: { fabricante: string; quantidade: number }[];
  removidosPorFabricante: { fabricante: string; quantidade: number }[];
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
  novos: string[];
  removidos: string[];
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

export async function compararPeriodos(
  base: string,
  alvo: string,
  pagina = 1,
  porPagina = 50,
): Promise<ResultadoComparacao> {
  await exigirSessao();
  if (!/^\d{4}-\d{2}$/.test(base) || !/^\d{4}-\d{2}$/.test(alvo)) {
    throw new Error("Períodos inválidos");
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

  const [res, resFab] = await Promise.all([
    db.execute(sql`
    WITH base AS (
      SELECT marcas, md5(CAST(json_build_array(${sql.raw(LISTA_CAMPOS_SQL)}) AS text)) AS h
      FROM aeronaves WHERE periodo = ${base}
    ), alvo AS (
      SELECT marcas, md5(CAST(json_build_array(${sql.raw(LISTA_CAMPOS_SQL)}) AS text)) AS h
      FROM aeronaves WHERE periodo = ${alvo}
    )
    SELECT COALESCE(base.marcas, alvo.marcas) AS marcas,
           base.marcas AS base_m,
           alvo.marcas AS alvo_m,
           (SELECT count(*)::int FROM aeronaves WHERE periodo = ${base}) AS total_base,
           (SELECT count(*)::int FROM aeronaves WHERE periodo = ${alvo}) AS total_alvo
    FROM base FULL JOIN alvo USING (marcas)
    WHERE base.h IS DISTINCT FROM alvo.h
       OR base.marcas IS NULL
       OR alvo.marcas IS NULL
  `),
    db.execute(sql`
    WITH base AS (
      SELECT marcas, nm_fabricante FROM aeronaves WHERE periodo = ${base}
    ), alvo AS (
      SELECT marcas, nm_fabricante FROM aeronaves WHERE periodo = ${alvo}
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

  const novos: string[] = [];
  const removidos: string[] = [];
  const alteradas: string[] = [];
  const totalBase = (res.rows[0]?.total_base as number) ?? 0;
  for (const r of res.rows) {
    const marcas = r.marcas as string;
    if (r.base_m && r.alvo_m) {
      alteradas.push(marcas);
    } else if (r.alvo_m) {
      novos.push(marcas);
    } else {
      removidos.push(marcas);
    }
  }
  novos.sort();
  removidos.sort();
  alteradas.sort();

  let alterados: DiferencaAeronave[] = [];
  if (alteradas.length > 0) {
    const [linhasBase, linhasAlvo, propBase, propAlvo, opBase, opAlvo] =
      await Promise.all([
        db
          .select()
          .from(aeronaves)
          .where(and(inArray(aeronaves.marcas, alteradas), eq(aeronaves.periodo, base))),
        db
          .select()
          .from(aeronaves)
          .where(and(inArray(aeronaves.marcas, alteradas), eq(aeronaves.periodo, alvo))),
        db
          .select()
          .from(aeronaveProprietarios)
          .where(
            and(
              inArray(aeronaveProprietarios.aeronaveMarcas, alteradas),
              eq(aeronaveProprietarios.periodo, base),
            ),
          ),
        db
          .select()
          .from(aeronaveProprietarios)
          .where(
            and(
              inArray(aeronaveProprietarios.aeronaveMarcas, alteradas),
              eq(aeronaveProprietarios.periodo, alvo),
            ),
          ),
        db
          .select()
          .from(aeronaveOperadores)
          .where(
            and(
              inArray(aeronaveOperadores.aeronaveMarcas, alteradas),
              eq(aeronaveOperadores.periodo, base),
            ),
          ),
        db
          .select()
          .from(aeronaveOperadores)
          .where(
            and(
              inArray(aeronaveOperadores.aeronaveMarcas, alteradas),
              eq(aeronaveOperadores.periodo, alvo),
            ),
          ),
      ]);

    const docs = new Set<string>();
    for (const p of [...propBase, ...propAlvo]) docs.add(p.proprietarioDocumento);
    for (const o of [...opBase, ...opAlvo]) docs.add(o.operadorDocumento);
    const docsArr = [...docs];

    const [proprietariosBase, proprietariosAlvo, operadoresBase, operadoresAlvo] =
      await Promise.all([
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
      ]);

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

    alterados = alteradas.map((marcas) => {
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
        campos.push({
          campo: "Proprietários",
          antes: proprietariosDiff.removidos.length ? `Removidos: ${proprietariosDiff.removidos.join("; ")}` : "—",
          depois: proprietariosDiff.adicionados.length ? `Adicionados: ${proprietariosDiff.adicionados.join("; ")}` : "—",
        });
      }
      const operadoresDiff = compararVinculos(
        voB.get(marcas) ?? new Map(),
        voA.get(marcas) ?? new Map(),
      );
      if (operadoresDiff.adicionados.length || operadoresDiff.removidos.length || operadoresDiff.alterados.length) {
        campos.push({
          campo: "Operadores",
          antes: operadoresDiff.removidos.length ? `Removidos: ${operadoresDiff.removidos.join("; ")}` : "—",
          depois: operadoresDiff.adicionados.length ? `Adicionados: ${operadoresDiff.adicionados.join("; ")}` : "—",
        });
      }
      return {
        marcas,
        campos,
        proprietarios: proprietariosDiff,
        operadores: operadoresDiff,
      };
    });
  }

  const total = alterados.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const fatia = alterados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const contagemCampos = new Map<string, number>();
  for (const a of alterados) {
    for (const c of a.campos) {
      contagemCampos.set(c.campo, (contagemCampos.get(c.campo) ?? 0) + 1);
    }
  }
  const camposMaisAlterados = [...contagemCampos.entries()]
    .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
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

  return {
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
    novos,
    removidos,
    alterados: fatia,
    pagina,
    paginas,
  };
}