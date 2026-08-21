import { createHash } from "crypto";
import { z } from "zod";

export const situacoes = {
  R: { label: "Reserva de marcas", cor: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30" },
  N: { label: "Situação normal", cor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  S: { label: "CA suspenso", cor: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400" },
  C: { label: "CA cancelado", cor: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400" },
  V: { label: "CA vencido", cor: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400" },
  X: { label: "Aeronave interditada", cor: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400" },
  U: { label: "Ultraleve (normal)", cor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  Z: { label: "Experimental (normal)", cor: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400" },
  P: { label: "Situação punitiva", cor: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400" },
  M: { label: "Matrícula cancelada", cor: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30" },
} as const;

export const motivosSuspensao: Record<string, string> = {
  "1": "Aeronave avariada por acidentes ou incidentes",
  "3": "Pendências judiciais",
  "4": "Situação irregular no RAB",
  "6": "Situação técnica irregular",
  "7": "Não cumprimento de NCIA",
  "8": "CVA vencida",
};

export function situacaoBase(s: string | null | undefined): string {
  if (!s) return "";
  return (s[0] ?? "").toUpperCase();
}

export const situacaoLabel = (s: string | null | undefined) => {
  const base = situacaoBase(s);
  const label =
    base in situacoes ? situacoes[base as keyof typeof situacoes].label : null;
  const motivo = s && s.length > 1 ? s.slice(1) : "";
  const motivoLabel = motivo && motivosSuspensao[motivo] ? ` · ${motivosSuspensao[motivo]}` : "";
  return label ? `${label}${motivoLabel}` : "Indisponível";
};

export const situacaoCor = (s: string | null | undefined) => {
  const base = situacaoBase(s);
  return base in situacoes
    ? situacoes[base as keyof typeof situacoes].cor
    : "bg-zinc-500/15 text-zinc-500 border-zinc-500/30";
};

export const aeronaveSchema = z.object({
  marcas: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(PP|PR|PT|PS|PU)[A-Z]{3}$/, "Marca inválida — use o padrão PPXXX, PRXXX, PTXXX, PSXXX ou PUXXX (ex.: PUYES)"),
  nrCertMatricula: z.string().trim().optional(),
  nrSerie: z.string().trim().optional(),
  cdTipo: z.string().trim().optional(),
  dsModelo: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  nmFabricante: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  cdCls: z.string().trim().optional(),
  nrPmd: z.string().trim().optional(),
  cdTipoIcao: z.string().trim().optional(),
  nrTripulacaoMin: z.string().trim().optional(),
  nrPassageirosMax: z.string().trim().optional(),
  nrAssentos: z.string().trim().optional(),
  nrAnoFabricacao: z.string().trim().optional(),
  dtValidadeCva: z.string().trim().optional(),
  dtValidadeCa: z.string().trim().optional(),
  dtCanc: z.string().trim().optional(),
  dsMotivoCanc: z.string().trim().optional(),
  cdInterdicao: z
    .string()
    .trim()
    .toUpperCase()
    .max(10, "Código inválido")
    .optional(),
  dsGravame: z.string().trim().optional(),
  dtMatricula: z.string().trim().optional(),
  tpMotor: z.string().trim().optional(),
  qtMotor: z.string().trim().optional(),
  tpPouso: z.string().trim().optional(),
  tpCa: z.string().trim().optional(),
  cdPropositoCave: z.string().trim().optional(),
  cfOperacional: z.string().trim().optional(),
  dsCategoriaHomologacao: z.string().trim().optional(),
  tpOperacao: z.string().trim().optional(),
});

export type AeronaveForm = z.infer<typeof aeronaveSchema>;

export function toInt(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function toDate(value: string | undefined): Date | null {
  if (value == null || value === "" || value === "ABORDO") return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toNumeric(value: string | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export function calcularHashAeronave(d: {
  nrCertMatricula?: number | null;
  nrSerie?: string | null;
  cdTipo?: string | null;
  dsModelo?: string | null;
  nmFabricante?: string | null;
  cdCls?: string | null;
  nrPmd?: string | null;
  cdTipoIcao?: string | null;
  nrTripulacaoMin?: number | null;
  nrPassageirosMax?: number | null;
  nrAssentos?: number | null;
  nrAnoFabricacao?: number | null;
  dtValidadeCva?: string | null;
  dtValidadeCa?: Date | string | null;
  dtCanc?: Date | string | null;
  dsMotivoCanc?: string | null;
  cdInterdicao?: string | null;
  dsGravame?: string | null;
  dtMatricula?: Date | string | null;
  tpMotor?: string | null;
  qtMotor?: number | null;
  tpPouso?: string | null;
  tpCa?: string | null;
  cdPropositoCave?: string | null;
  cfOperacional?: string | null;
  dsCategoriaHomologacao?: string | null;
  tpOperacao?: string | null;
}): string {
  // Replica SQL: md5(CAST(json_build_array(col1, col2, ...) AS text))
  // json_build_array serializa cada valor como JSON (null, string, number)
  const arr = [
    d.nrCertMatricula ?? null,
    d.nrSerie ?? null,
    d.cdTipo ?? null,
    d.dsModelo ?? null,
    d.nmFabricante ?? null,
    d.cdCls ?? null,
    d.nrPmd ?? null,
    d.cdTipoIcao ?? null,
    d.nrTripulacaoMin ?? null,
    d.nrPassageirosMax ?? null,
    d.nrAssentos ?? null,
    d.nrAnoFabricacao ?? null,
    d.dtValidadeCva ?? null,
    d.dtValidadeCa ? (d.dtValidadeCa instanceof Date ? d.dtValidadeCa.toISOString() : String(d.dtValidadeCa)) : null,
    d.dtCanc ? (d.dtCanc instanceof Date ? d.dtCanc.toISOString() : String(d.dtCanc)) : null,
    d.dsMotivoCanc ?? null,
    d.cdInterdicao ?? null,
    d.dsGravame ?? null,
    d.dtMatricula ? (d.dtMatricula instanceof Date ? d.dtMatricula.toISOString() : String(d.dtMatricula)) : null,
    d.tpMotor ?? null,
    d.qtMotor ?? null,
    d.tpPouso ?? null,
    d.tpCa ?? null,
    d.cdPropositoCave ?? null,
    d.cfOperacional ?? null,
    d.dsCategoriaHomologacao ?? null,
    d.tpOperacao ?? null,
  ];
  const json = JSON.stringify(arr);
  return createHash("md5").update(json).digest("hex");
}