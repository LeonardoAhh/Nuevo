"use client";

import { SectionTitle } from "./presentation";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIPO_LABEL } from "@/lib/catalogo";
import { InfoField } from "./form-controls";
import { ComboboxEvaluador } from "./evaluator-select";
function getTipoLabel(tipo: string | undefined): string {
  return tipo ? TIPO_LABEL[tipo] ?? tipo.toUpperCase() : "";
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
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          <strong>Instrucciones para el evaluador:</strong> {DESEMPENO.instructions}
      </p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle>
                  EVALUACIÓN DE DESEMPEÑO PERSONAL {getTipoLabel(data.tipo)}
            </SectionTitle>
              <Badge variant="default" className="text-xs">{data.periodo || "—"}</Badge>
          </div>
        </div>
          <img src="/logo-vino-plastic.png" alt="Logotipo de VIÑOPLASTIC" className="h-10 w-auto object-contain" onError={e => {
            ;
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }} />
      </div>
    </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoField label={DESEMPENO.fields.employeeNumber}>
            <span className="text-lg font-bold">{data.numero_empleado || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.name}>
            <span className="font-bold">{data.nombre || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.position}>
            <span className="font-bold">{data.puesto || "—"}</span>
        </InfoField>

          <InfoField label={DESEMPENO.fields.evaluator}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1">
              <div className="flex-1 w-full sm:w-auto">
                {canEdit ? <ComboboxEvaluador value={data.evaluador_nombre ?? ""} onChange={handleEvaluadorChange} /> : <span className="font-medium" aria-label={`Evaluador: ${data.evaluador_nombre || "sin asignar"}`}>
                  {data.evaluador_nombre || "—"}
              </span>}
            </div>
              {data.evaluador_puesto && <span className="text-sm text-muted-foreground break-words">
                  — {data.evaluador_puesto}
            </span>}
          </div>
        </InfoField>
      </div>
    </CardContent>
  </Card>
</>;
}
