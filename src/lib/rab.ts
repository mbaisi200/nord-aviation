export const COLUNAS_RAB = [
  "MARCAS",
  "PROPRIETARIOS",
  "OPERADORES",
  "NR_CERT_MATRICULA",
  "NR_SERIE",
  "CD_TIPO",
  "DS_MODELO",
  "NM_FABRICANTE",
  "CD_CLS",
  "NR_PMD",
  "CD_TIPO_ICAO",
  "NR_TRIPULACAO_MIN",
  "NR_PASSAGEIROS_MAX",
  "NR_ASSENTOS",
  "NR_ANO_FABRICACAO",
  "DT_VALIDADE_CVA",
  "DT_VALIDADE_CA",
  "DT_CANC",
  "DS_MOTIVO_CANC",
  "CD_INTERDICAO",
  "DS_GRAVAME",
  "DT_MATRICULA",
  "TP_MOTOR",
  "QT_MOTOR",
  "TP_POUSO",
  "TP_CA",
  "CD_PROPOSITO_CAVE",
  "CF_OPERACIONAL",
  "DS_CATEGORIA_HOMOLOGACAO",
  "TP_OPERACAO",
] as const;

export function parseJsonField(value: string): Record<string, string>[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toBool(value: string | undefined): boolean {
  return value?.toUpperCase() === "S";
}

export function toInt(value: string | undefined): number | null {
  if (value == null || value === "" || value === "-") return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function toPmd(value: string | undefined): string | null {
  if (value == null || value === "" || value === "-") return null;
  let v = value.trim();
  if (v.includes(",")) {
    v = v.replace(/\./g, "").replace(",", ".");
  } else if (v.includes(".")) {
    const partes = v.split(".");
    const ultimo = partes[partes.length - 1];
    if (ultimo.length === 3) v = v.replace(/\./g, "");
  }
  v = v.replace(/^0+(?=\d)/, "");
  if (v.endsWith(".")) v = v.slice(0, -1);
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
}

export function toDate(value: string | undefined): Date | null {
  if (
    value == null ||
    value === "" ||
    value === "-" ||
    value === "ABORDO" ||
    value === "RESRA" ||
    value === "RESRAB"
  )
    return null;
  let m: RegExpMatchArray | null;
  m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const ano = Number(m[3]) >= 30 ? 1900 + Number(m[3]) : 2000 + Number(m[3]);
    const d = new Date(ano, Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toSituacao(value: string | undefined): string | null {
  if (value == null || value === "" || value === "-") return null;
  return value.toUpperCase().trim();
}

export function parseCsv(texto: string): Record<string, string>[] {
  const linhas: string[][] = [];
  let campo = "";
  let entreAspas = false;
  let linha: string[] = [];
  const pushCampo = () => {
    linha.push(campo);
    campo = "";
  };
  const pushLinha = () => {
    pushCampo();
    if (linha.length > 1 || (linha.length === 1 && linha[0] !== "")) {
      linhas.push(linha);
    }
    linha = [];
  };
  const s = texto.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entreAspas) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === ";") {
      pushCampo();
    } else if (c === "\r") {
      if (s[i + 1] === "\n") i++;
      pushLinha();
    } else if (c === "\n") {
      pushLinha();
    } else {
      campo += c;
    }
  }
  pushLinha();

  return linhas
    .slice(2)
    .filter((l) => (l[0] ?? "").trim() !== "")
    .map((l) => {
      const o: Record<string, string> = {};
      COLUNAS_RAB.forEach((c, i) => {
        o[c] = l[i] ?? "";
      });
      return o;
    });
}