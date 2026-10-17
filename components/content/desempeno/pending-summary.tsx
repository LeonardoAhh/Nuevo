"use client";

import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluationSearchContext } from "./use-evaluation-search";
export function PendingSummary({
  context
}: {
  context: EvaluationSearchContext;
}) {
  const {
    data,
    existingEvaluation,
    loading,
    totalEvals,
    totalVencidas,
    totalProximas,
    totalATiempo
  } = context;
  return <>{!loading && !data && !existingEvaluation && totalEvals > 0 && <div className="w-full">
      {(() => {
        const hasVencidas = totalVencidas > 0;
        const hasProximas = totalProximas > 0;
        let bgClass = "bg-card border-success";
        let iconBgClass = "border border-success/20 bg-success/10 text-success";
        let titleText = "Evaluaciones al día";
        let descText = `Tienes ${totalEvals} ${totalEvals === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'} con tiempo suficiente.`;
        if (hasVencidas) {
          bgClass = "bg-card border-destructive";
          iconBgClass = "border border-destructive/20 bg-destructive/10 text-destructive";
          titleText = `${totalVencidas} ${totalVencidas === 1 ? 'evaluación atrasada' : 'evaluaciones atrasadas'}`;
          descText = "Ya pasaron su fecha límite. Atiéndelas primero para regularizar el seguimiento.";
        } else if (hasProximas) {
          bgClass = "bg-card border-warning";
          iconBgClass = "border border-warning/30 bg-warning/10 text-warning";
          titleText = `${totalProximas} ${totalProximas === 1 ? 'evaluación vence' : 'evaluaciones vencen'} pronto`;
          descText = "Revisa tu lista para asegurar su evaluación oportuna esta semana.";
        }
        const stats = [
          { label: "Vencidas", value: totalVencidas, color: "text-destructive" },
          { label: "Próximas", value: totalProximas, color: "text-warning" },
          { label: "A tiempo", value: totalATiempo, color: "text-success" },
        ] as const;
        return <div className={cn("flex flex-col items-center justify-between gap-6 rounded-xl border p-5 font-sans sm:flex-row", bgClass)}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
            <div className={cn("flex shrink-0 rounded-md p-3", iconBgClass)}>
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="space-y-4 w-full flex-1">
              <div className="space-y-1">
                <h3 className="text-base font-semibold leading-6 text-foreground">
                  {titleText}
                </h3>
                <p className="text-sm font-normal leading-5 text-muted-foreground">
                  {descText}
                </p>
              </div>

              <dl className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map(({ label, value, color }) => (
                  <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-md border bg-card px-3 py-2.5">
                    <dt className="min-w-0 text-sm font-medium leading-5 text-foreground">{label}</dt>
                    <dd className={cn("shrink-0 text-xl font-semibold leading-7 tabular-nums", color)}>{value}</dd>
                  </div>
                ))}
              </dl>

            </div>
          </div>
        </div>;
      })()}
    </div>}</>;
}
