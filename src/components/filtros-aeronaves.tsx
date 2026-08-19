import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui";
import type { FiltrosAeronaves } from "@/app/actions/aeronaves";

const OPCOES_SITUACAO = [
  { v: "N", r: "Situação normal" },
  { v: "R", r: "Reserva de marcas" },
  { v: "S", r: "CA suspenso" },
  { v: "C", r: "CA cancelado" },
  { v: "V", r: "CA vencido" },
  { v: "X", r: "Aeronave interditada" },
  { v: "U", r: "Ultraleve (normal)" },
  { v: "Z", r: "Experimental (normal)" },
  { v: "P", r: "Situação punitiva" },
  { v: "M", r: "Matrícula cancelada" },
];

const OPCOES_TP_MOTOR = [
  "MOTOR CONVENCIONAL",
  "MOTOR JATO/TURBOFAN",
  "MOTOR TURBOHELICE",
  "MOTOR TURBOEIXO",
  "MOTOR A PISTÃO",
  "MOTOR ELETRICO",
  "SEM MOTOR",
  "DRONE",
];

const OPCOES_QT_MOTOR = ["0", "1", "2", "3", "4"];

const OPCOES_TP_POUSO = [
  "POUSO CONVENCIONAL",
  "HELICOPTERO",
  "ANFIBIO",
  "GIROCOPTERO",
  "POUSO EM TERRA",
  "POUSO NA AGUA",
  "DRONE (RPAS)",
];

const OPCOES_TP_CA = [
  "CA PADRAO",
  "CAVE",
  "AEV",
  "CEALE",
  "APO",
  "CAER",
  "APO+CAVE",
  "CAARF",
];

const OPCOES_CF_OPERACIONAL = [
  "RBAC 91",
  "RBAC 135",
  "RBAC 121",
  "RBAC E94",
];

const OPCOES_CATEGORIA = [
  "NORMAL",
  "TRANSPORTE",
  "RESTRITA",
  "UTILIDADE",
  "NORMAL/RESTRITA",
  "NORMAL/UTILIDADE",
  "NÃO CERTIFICADA",
  "TRANSP.REGIONAL",
  "TRANSPORTE A/B",
  "RPAS AUTORIZADO",
  "NORMAL/ACROBATICA",
  "TRANSPORTE B",
  "ACROBATICA",
  "TRANSPORTE A",
  "PRIMARIA",
  "SEMI ACROBATICA",
  "CLASSE ESPECIAL",
  "ACROB./RESTRITA",
  "UTIL./ACROBATICA",
  "NORMAL/S.ACROB.",
  "UTILIDADE/S.ACROB",
  "NORMAL/UT./REST.",
];

const OPCOES_TP_OPERACAO = [
  "PRIVADO",
  "PUBLICO ESTADUAL",
  "PUBLICO FEDERAL",
  "PRIVADA",
  "PUBLICO DISTRITO FEDERAL",
  "PUBLICO MUNICIPAL",
  "PUBLICA ESTADUAL",
  "PUBLICO",
];

function SelectFiltro({
  nome,
  rotulo,
  valor,
  opcoes,
}: {
  nome: keyof FiltrosAeronaves;
  rotulo: string;
  valor: string | undefined;
  opcoes: { v: string; r: string }[] | string[];
}) {
  return (
    <Field label={rotulo} htmlFor={`f-${nome}`}>
      <Select id={`f-${nome}`} name={nome} defaultValue={valor ?? ""}>
        <option value="">Todos</option>
        {opcoes.map((o) => {
          const v = typeof o === "string" ? o : o.v;
          const r = typeof o === "string" ? o : o.r;
          return (
            <option key={v} value={v}>
              {r}
            </option>
          );
        })}
      </Select>
    </Field>
  );
}

export function FiltrosAeronaves({
  valores,
  ativos,
}: {
  valores: FiltrosAeronaves;
  ativos: boolean;
}) {
  return (
    <CardFiltros ativos={ativos}>
      <form action="/aeronaves" className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fabricante" htmlFor="f-fabricante">
            <Input
              id="f-fabricante"
              name="fabricante"
              defaultValue={valores.fabricante}
              placeholder="Ex.: CIRRUS"
            />
          </Field>
          <Field label="Modelo" htmlFor="f-modelo">
            <Input
              id="f-modelo"
              name="modelo"
              defaultValue={valores.modelo}
              placeholder="Ex.: SR22"
            />
          </Field>
          <SelectFiltro
            nome="situacao"
            rotulo="Situação"
            valor={valores.situacao}
            opcoes={OPCOES_SITUACAO}
          />
          <SelectFiltro
            nome="tpMotor"
            rotulo="Tipo de motor"
            valor={valores.tpMotor}
            opcoes={OPCOES_TP_MOTOR}
          />
          <SelectFiltro
            nome="qtMotor"
            rotulo="Qtde. de motores"
            valor={valores.qtMotor}
            opcoes={OPCOES_QT_MOTOR}
          />
          <SelectFiltro
            nome="tpPouso"
            rotulo="Tipo de pouso"
            valor={valores.tpPouso}
            opcoes={OPCOES_TP_POUSO}
          />
          <SelectFiltro
            nome="tpCa"
            rotulo="Tipo de CA"
            valor={valores.tpCa}
            opcoes={OPCOES_TP_CA}
          />
          <SelectFiltro
            nome="cfOperacional"
            rotulo="CF operacional"
            valor={valores.cfOperacional}
            opcoes={OPCOES_CF_OPERACIONAL}
          />
          <SelectFiltro
            nome="categoria"
            rotulo="Categoria de homologação"
            valor={valores.categoria}
            opcoes={OPCOES_CATEGORIA}
          />
          <SelectFiltro
            nome="tpOperacao"
            rotulo="Tipo de operação"
            valor={valores.tpOperacao}
            opcoes={OPCOES_TP_OPERACAO}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ano de fabricação de" htmlFor="f-anoDe">
              <Input
                id="f-anoDe"
                name="anoDe"
                type="number"
                min={1900}
                max={2100}
                defaultValue={valores.anoDe}
                placeholder="Ex.: 2000"
              />
            </Field>
            <Field label="até" htmlFor="f-anoAte">
              <Input
                id="f-anoAte"
                name="anoAte"
                type="number"
                min={1900}
                max={2100}
                defaultValue={valores.anoAte}
                placeholder="Ex.: 2020"
              />
            </Field>
          </div>
          <Field label="Proprietário" htmlFor="f-proprietario">
            <Input
              id="f-proprietario"
              name="proprietario"
              defaultValue={valores.proprietario}
              placeholder="Nome do proprietário"
            />
          </Field>
          <Field label="Operador" htmlFor="f-operador">
            <Input
              id="f-operador"
              name="operador"
              defaultValue={valores.operador}
              placeholder="Nome do operador"
            />
          </Field>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-[15px] font-semibold text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-sky-600/30"
        >
          Aplicar filtros
        </button>
      </form>
    </CardFiltros>
  );
}

function CardFiltros({
  ativos,
  children,
}: {
  ativos: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-semibold">Filtros</span>
        {ativos ? (
          <Link
            href="/aeronaves"
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}