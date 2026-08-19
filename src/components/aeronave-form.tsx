"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { AeronaveForm } from "@/lib/aeronave";
import { situacoes } from "@/lib/aeronave";
import type { ActionState } from "@/app/actions/aeronaves";
import { Button, Field, Input, Select } from "@/components/ui";

type Action = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

function dataParaInput(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function AeronaveForm({
  action,
  submitLabel,
  values,
}: {
  action: Action;
  submitLabel: string;
  values?: AeronaveForm;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { ok: false },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <Field
        label="Marca (prefixo)"
        htmlFor="marcas"
        hint="Padrão: PP, PR, PT, PS ou PU + 3 letras. Ex.: PUYES"
      >
        <Input
          id="marcas"
          name="marcas"
          required
          maxLength={5}
          defaultValue={values?.marcas}
          placeholder="PUYES"
          className="font-mono uppercase"
          autoCapitalize="characters"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nº matrícula" htmlFor="nrCertMatricula">
          <Input
            id="nrCertMatricula"
            name="nrCertMatricula"
            inputMode="numeric"
            defaultValue={values?.nrCertMatricula}
          />
        </Field>
        <Field label="Nº série" htmlFor="nrSerie">
          <Input id="nrSerie" name="nrSerie" defaultValue={values?.nrSerie} />
        </Field>
      </div>

      <Field label="Modelo" htmlFor="dsModelo">
        <Input
          id="dsModelo"
          name="dsModelo"
          defaultValue={values?.dsModelo}
          placeholder="Ex.: VIMANA R-12"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fabricante" htmlFor="nmFabricante">
          <Input
            id="nmFabricante"
            name="nmFabricante"
            defaultValue={values?.nmFabricante}
          />
        </Field>
        <Field label="Ano de fabricação" htmlFor="nrAnoFabricacao">
          <Input
            id="nrAnoFabricacao"
            name="nrAnoFabricacao"
            inputMode="numeric"
            maxLength={4}
            defaultValue={values?.nrAnoFabricacao}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Classe" htmlFor="cdCls">
          <Input id="cdCls" name="cdCls" defaultValue={values?.cdCls} />
        </Field>
        <Field label="Tipo ICAO" htmlFor="cdTipoIcao">
          <Input
            id="cdTipoIcao"
            name="cdTipoIcao"
            defaultValue={values?.cdTipoIcao}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="PMD (kg)" htmlFor="nrPmd">
          <Input
            id="nrPmd"
            name="nrPmd"
            inputMode="numeric"
            defaultValue={values?.nrPmd}
          />
        </Field>
        <Field label="Assentos" htmlFor="nrAssentos">
          <Input
            id="nrAssentos"
            name="nrAssentos"
            inputMode="numeric"
            defaultValue={values?.nrAssentos}
          />
        </Field>
        <Field label="Trip. mín." htmlFor="nrTripulacaoMin">
          <Input
            id="nrTripulacaoMin"
            name="nrTripulacaoMin"
            inputMode="numeric"
            defaultValue={values?.nrTripulacaoMin}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de motor" htmlFor="tpMotor">
          <Input
            id="tpMotor"
            name="tpMotor"
            defaultValue={values?.tpMotor}
            placeholder="Ex.: MOTOR CONVENCIONAL"
          />
        </Field>
        <Field label="Qtd. motores" htmlFor="qtMotor">
          <Input
            id="qtMotor"
            name="qtMotor"
            inputMode="numeric"
            defaultValue={values?.qtMotor}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de pouso" htmlFor="tpPouso">
          <Input
            id="tpPouso"
            name="tpPouso"
            defaultValue={values?.tpPouso}
            placeholder="Ex.: POUSO CONVENCIONAL"
          />
        </Field>
        <Field label="Tipo de operação" htmlFor="tpOperacao">
          <Input
            id="tpOperacao"
            name="tpOperacao"
            defaultValue={values?.tpOperacao}
            placeholder="PRIVADO / PÚBLICO"
          />
        </Field>
      </div>

      <Field label="Situação de aeronavegabilidade" htmlFor="cdInterdicao">
        <Select id="cdInterdicao" name="cdInterdicao" defaultValue={values?.cdInterdicao ?? ""}>
          <option value="">Indisponível</option>
          {Object.entries(situacoes).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {valor} — {label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data de matrícula" htmlFor="dtMatricula">
          <Input
            id="dtMatricula"
            name="dtMatricula"
            type="date"
            defaultValue={values?.dtMatricula}
          />
        </Field>
        <Field label="Validade CVA" htmlFor="dtValidadeCva">
          <Input
            id="dtValidadeCva"
            name="dtValidadeCva"
            type="date"
            defaultValue={values?.dtValidadeCva}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Validade CA" htmlFor="dtValidadeCa">
          <Input
            id="dtValidadeCa"
            name="dtValidadeCa"
            type="date"
            defaultValue={dataParaInput(
              values?.dtValidadeCa ? new Date(values.dtValidadeCa) : null,
            )}
          />
        </Field>
        <Field label="Data de cancelamento" htmlFor="dtCanc">
          <Input
            id="dtCanc"
            name="dtCanc"
            type="date"
            defaultValue={dataParaInput(
              values?.dtCanc ? new Date(values.dtCanc) : null,
            )}
          />
        </Field>
      </div>

      <Field label="Motivo de cancelamento" htmlFor="dsMotivoCanc">
        <Input
          id="dsMotivoCanc"
          name="dsMotivoCanc"
          defaultValue={values?.dsMotivoCanc}
        />
      </Field>

      <Field label="Gravame" htmlFor="dsGravame">
        <Input
          id="dsGravame"
          name="dsGravame"
          defaultValue={values?.dsGravame}
        />
      </Field>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}