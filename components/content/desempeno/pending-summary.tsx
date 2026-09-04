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
    totalEvals,
    totalVencidas,
    totalProximas,
    totalATiempo
  } = context;
  return <>{!data && totalEvals > 0 && <div className="w-full">
      {(() => {
        const hasVencidas = totalVencidas > 0;
        const hasProximas = totalProximas > 0;
        let bgClass = "bg-card border-success";
        let iconBgClass = "bg-success text-success-foreground";
        let titleText = "Evaluaciones al día";
        let descText = `Tienes ${totalEvals} ${totalEvals === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'} con tiempo suficiente.`;
        if (hasVencidas) {
          bgClass = "bg-card border-destructive";
          iconBgClass = "bg-destructive text-destructive-foreground";
          titleText = `${totalVencidas} ${totalVencidas === 1 ? 'evaluación atrasada' : 'evaluaciones atrasadas'}`;
          descText = "Ya pasaron su fecha límite. Atiéndelas primero para regularizar el seguimiento.";
        } else if (hasProximas) {
          bgClass = "bg-card border-warning";
          iconBgClass = "bg-warning text-warning-foreground";
          titleText = `${totalProximas} ${totalProximas === 1 ? 'evaluación vence' : 'evaluaciones vencen'} pronto`;
          descText = "Revisa tu lista para asegurar su evaluación oportuna esta semana.";
        }
        return <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl border p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300", bgClass)}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
            <div className={cn("rounded-lg p-3 shrink-0 hidden sm:flex", iconBgClass)}>
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="space-y-4 w-full flex-1">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground leading-none flex items-center gap-2">
                  <span className="sm:hidden" aria-hidden="true">
                    {hasVencidas ? "🔴" : hasProximas ? "🟠" : "🟢"}
                  </span>
                  {titleText}
                </h3>
                <p className="text-sm text-muted-foreground leading-snug">
                  {descText}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                {/* Vencidas */}
                <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                  <span className="text-2xl font-bold leading-none text-destructive">{totalVencidas}</span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">Vencidas</span>
                </div>

                {/* Próximas */}
                <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                  <span className="text-2xl font-bold leading-none text-warning">{totalProximas}</span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium truncate" title="Próximas (7d)">Próximas</span>
                </div>

                {/* A tiempo */}
                <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                  <span className="text-2xl font-bold leading-none text-success">{totalATiempo}</span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">A tiempo</span>
                </div>
              </div>

            </div>
          </div>
        </div>;
      })()}
    </div>}</>;
}
