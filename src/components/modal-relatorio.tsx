"use client";

import { X, FileSpreadsheet, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export function ModalRelatorio({
  titulo,
  subtitulo,
  base,
  alvo,
  hrefVoltar,
  children,
}: {
  titulo: string;
  subtitulo: string;
  base: string;
  alvo: string;
  hrefVoltar?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const fechar = () => {
    router.push(hrefVoltar || `/comparar?base=${base}&alvo=${alvo}`);
  };

  const exportarPdf = () => {
    const el = contentRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${titulo}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
  p.sub { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  th, td { border: 1px solid #d4d4d8; padding: 0.4rem 0.6rem; text-align: left; }
  th { background: #f4f4f5; font-weight: 600; }
  .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #999; }
  span.inline-flex { display: inline-flex; align-items: center; gap: 0.5rem; }
  span.font-mono { margin-right: 0.5rem; }
</style></head><body>`);
    win.document.write(el.innerHTML);
    win.document.write(`<div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} — Nord Aviation RAB</div>`);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };

  const exportarXls = () => {
    const el = contentRef.current;
    if (!el) return;
    const table = el.querySelector("table");
    if (!table) return;

    // Gera HTML table que o Excel abre nativamente
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>`;
    html += `<x:Name>Relatório</x:Name>`;
    html += `<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>`;
    html += `</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
    html += `<style>td,th{mso-number-format:\@;}</style></head><body>`;
    html += `<h2>${titulo}</h2>`;
    html += `<p>${subtitulo}</p>`;
    html += table.outerHTML;
    html += `<p style="font-size:10px;color:#999">Gerado em ${new Date().toLocaleString("pt-BR")} — Nord Aviation RAB</p>`;
    html += `</body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${base}-${alvo}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 backdrop-blur-sm print:bg-white print:p-0 print:backdrop-blur-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {titulo}
            </h2>
            <p className="text-sm text-zinc-500">{subtitulo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Printer className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={exportarXls}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              XLS
            </button>
            <button
              type="button"
              onClick={fechar}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div ref={contentRef} className="max-h-[70vh] overflow-y-auto p-5 print:max-h-none print:overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
