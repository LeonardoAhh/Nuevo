"use client";

import { SectionTitle } from "./presentation";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIPO_LABEL } from "@/lib/catalogo";
import { InfoField } from "./form-controls";
import { ComboboxEvaluador } from "./evaluator-select";
import { HITOS_NUEVO_INGRESO } from "@/lib/desempeno/hitos-nuevo-ingreso";
function getTipoLabel(tipo: string | undefined): string {
  return tipo ? (TIPO_LABEL[tipo] ?? tipo).toUpperCase() : "";
}
export function EmployeeCard({
  context
}: {
  context: EvaluationFormContext;
}) {
  const {
    data,
    canEdit,
    handleEvaluadorChange
  } = context;
  return <>
    {/* ── Header ── */}
    <Card>
      <CardHeader className="space-y-3">
        <p className="text-xs leading-4 text-muted-foreground">
          <span className="font-medium text-foreground">Instrucciones para el evaluador:</span> {DESEMPENO.instructions}
      </p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle>
                  EVALUACIÓN DE DESEMPEÑO PERSONAL {getTipoLabel(data.tipo)}
            </SectionTitle>
              <Badge variant="default" className="text-xs font-medium">{data.periodo || "—"}</Badge>
              {data.hito_nuevo_ingreso && <Badge variant="outline" className="text-xs font-medium">{HITOS_NUEVO_INGRESO[data.hito_nuevo_ingreso - 1].etiqueta}</Badge>}
          </div>
        </div>
          <img src="/logo-vino-plastic.png" alt="Logotipo de VIÑOPLASTIC" className="h-10 w-auto object-contain" onError={e => {
            ;
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }} />
      </div>
    </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <InfoField label={DESEMPENO.fields.employeeNumber}>
            <span className="text-base font-medium leading-6">{data.numero_empleado || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.name}>
            <span className="text-base font-medium leading-6">{data.nombre || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.position}>
            <span className="text-base font-medium leading-6">{data.puesto || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.evaluator}>
            <div className="min-w-0">
              {canEdit ? <ComboboxEvaluador value={data.evaluador_nombre ?? ""} onChange={handleEvaluadorChange} /> : <span className="break-words font-medium" aria-label={`Evaluador: ${data.evaluador_nombre || "sin asignar"}`}>
                {data.evaluador_nombre || "—"}
              </span>}
            </div>
        </InfoField>
      </div>
    </CardContent>
  </Card>
</>;
}
