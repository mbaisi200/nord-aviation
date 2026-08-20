"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileUp,
  Loader2,
  RefreshCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { importarLote, iniciarImportacao } from "@/app/actions/importar";
import { parseCsv } from "@/lib/rab";
import { Button, Card } from "@/components/ui";

const URL_ANAC =
  "https://www.gov.br/anac/pt-br/sistemas/rab/dados-abertos-do-rab";
const TAMANHO_LOTE = 2000;

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarPeriodo(p: string): string {
  const [ano, mes] = p.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${meses[Number(mes) - 1]} de ${ano}`;
}

export function ImportadorRab({ periodos }: { periodos: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [periodo, setPeriodo] = useState(mesAtual());
  const [linhas, setLinhas] = useState<Record<string, string>[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [status, setStatus] = useState<"idle" | "importando" | "erro" | "concluido">("idle");
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [erro, setErro] = useState("");

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setStatus("idle");
    setErro("");
    try {
      const texto = await arquivo.text();
      const linhas = parseCsv(texto);
      if (linhas.length === 0) {
        setErro(
          "Arquivo vazio ou com formato inválido. Baixe o CSV do RAB no site da ANAC e tente novamente.",
        );
        setLinhas(null);
        setNomeArquivo("");
        return;
      }
      setLinhas(linhas);
      setNomeArquivo(arquivo.name);
    } catch {
      setErro(
        "Não foi possível ler o arquivo. Verifique se é o CSV do RAB baixado no site da ANAC.",
      );
      setLinhas(null);
      setNomeArquivo("");
    }
  }

  async function importar() {
    if (!linhas || !periodo || status === "importando") return;
    setStatus("importando");
    setErro("");
    const total = Math.ceil(linhas.length / TAMANHO_LOTE);
    setProgresso({ atual: 0, total });
    try {
      await iniciarImportacao(periodo);
      for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
        await importarLote(periodo, linhas.slice(i, i + TAMANHO_LOTE));
        setProgresso({ atual: Math.min(i / TAMANHO_LOTE + 1, total), total });
      }
      setStatus("concluido");
      router.refresh();
    } catch (err) {
      setStatus("erro");
      setErro(
        err instanceof Error
          ? err.message
          : "Falha durante a importação. Se ficou pela metade, basta importar novamente — os dados do período são refeitos do zero.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/25">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">1. Baixe o arquivo do mês</p>
              <p className="text-sm text-zinc-500">
                Acesse o site da ANAC e baixe o CSV mais recente do RAB
              </p>
            </div>
            <a
              href={URL_ANAC}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-sky-300"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Site da ANAC</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 dark:from-sky-900 dark:to-indigo-900 dark:text-sky-300">
              <FileUp className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">2. Selecione o arquivo CSV</p>
              <p className="text-sm text-zinc-500">
                {linhas
                  ? `${linhas.length.toLocaleString("pt-BR")} aeronaves prontas (${nomeArquivo})`
                  : "O arquivo é lido no seu aparelho — nada é enviado antes da importação"}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={aoSelecionarArquivo}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "importando"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-sky-400 hover:text-sky-700 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-sky-300"
            >
              {linhas ? "Trocar arquivo" : "Escolher arquivo"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 dark:from-sky-900 dark:to-indigo-900 dark:text-sky-300">
              <RefreshCw className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">3. Período dos dados</p>
              <p className="text-sm text-zinc-500">
                Mês a que se referem os dados do arquivo
              </p>
            </div>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={status === "importando"}
              className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {periodos.includes(periodo) && status !== "concluido" ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                O período <strong>{formatarPeriodo(periodo)}</strong> já existe
                na base e será <strong>substituído</strong> pelos dados deste
                arquivo.
              </span>
            </div>
          ) : null}

          {erro ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          ) : null}

          {status === "importando" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  Importando ({progresso.atual} de {progresso.total} lotes)…
                </span>
                <span className="text-zinc-500">
                  {Math.round((progresso.atual / Math.max(1, progresso.total)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all"
                  style={{
                    width: `${(progresso.atual / Math.max(1, progresso.total)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                Se você fechar a tela no meio, não tem problema: importe de
                novo que o período é refeito por completo.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              onClick={importar}
              disabled={!linhas || !periodo}
              className="w-full"
            >
              {status === "concluido" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {status === "concluido"
                ? "Importado! Importar outro mês"
                : `Importar período ${periodo}`}
            </Button>
          )}

          {status === "concluido" ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-col gap-2">
                <span>
                  Período {formatarPeriodo(periodo)} importado com sucesso (
                  {linhas?.length.toLocaleString("pt-BR")} aeronaves).
                </span>
                <Link
                  href="/comparar"
                  className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                >
                  Ver o comparativo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {periodos.length > 0 ? (
        <Card className="p-4">
          <p className="text-sm font-semibold">Períodos já importados</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {periodos.map((p) => (
              <span
                key={p}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {formatarPeriodo(p)}
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}