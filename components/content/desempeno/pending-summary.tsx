"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { ArrowRight, ArrowUpRight } from "lucide";
import { MorphIcon } from "morphicons/react";
import { cn } from "@/lib/utils";
import type { PendingEvalStatus } from "@/lib/hooks/usePendingEvals";
import { PendingSummaryDetail } from "./pending-summary-detail";
import type { EvaluationSearchContext } from "./use-evaluation-search";
export function PendingSummary({
  context
}: {
  context: EvaluationSearchContext;
}) {
  const [activeStatus, setActiveStatus] = useState<PendingEvalStatus | null>(null);
  const [highlightedStatus, setHighlightedStatus] = useState<PendingEvalStatus | null>(null);
  const {
    data,
    existingEvaluation,
    loading,
    deptGroups,
    totalEvals,
    totalVencidas,
    totalProximas,
    totalATiempo
  } = context;
  return <>{!loading && !data && !existingEvaluation && totalEvals > 0 && <div className="mx-auto w-full max-w-[var(--evaluation-summary-max-width)]">
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
          { status: "vencidas", label: "Vencidas", value: totalVencidas, color: "text-destructive" },
          { status: "proximas", label: "Próximas", value: totalProximas, color: "text-warning" },
          { status: "a-tiempo", label: "A tiempo", value: totalATiempo, color: "text-success" },
        ] as const;
        return <><div className={cn("flex flex-col items-center justify-between gap-6 rounded-xl border p-5 font-sans sm:flex-row", bgClass)}>
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

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map(({ status, label, value, color }) => (
                  <button key={status} type="button" onClick={() => setActiveStatus(status)} onMouseEnter={() => setHighlightedStatus(status)} onMouseLeave={() => setHighlightedStatus(null)} onFocus={() => setHighlightedStatus(status)} onBlur={() => setHighlightedStatus(null)} aria-haspopup="dialog" aria-label={`${label}: ${value} ${value === 1 ? "evaluación" : "evaluaciones"}. Ver detalle`} className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-md border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <span className="min-w-0 text-sm font-medium leading-5 text-foreground">{label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn("text-xl font-semibold leading-7 tabular-nums", color)}>{value}</span>
                      <MorphIcon icon={highlightedStatus === status ? ArrowUpRight : ArrowRight} size={16} strokeWidth={2} spring="snappy" reducedMotion="user" className="text-muted-foreground" />
                    </span>
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div><PendingSummaryDetail status={activeStatus} groups={deptGroups} onOpenChange={open => { if (!open) setActiveStatus(null); }} /></>;
      })()}
    </div>}</>;
}
