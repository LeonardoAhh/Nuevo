import { useId } from "react";
import Link from "next/link";
import { Pencil, Printer, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PERIODOS_DESEMPENO } from "@/lib/catalogo";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { ScoreBadge } from "../desempeno-score-badge";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";
import { SAVED_DETAIL } from "./saved-detail-copy";

type Evaluation = NonNullable<SavedEvaluationsContext["empleadoSel"]>["evals"][number];
type Actions = Pick<SavedEvaluationsContext, "loading" | "pendingPrintId" | "handlePrint" | "eliminarEvaluacion">;

export function SavedEvaluationCard({ evaluation: ev, actions }: { evaluation: Evaluation; actions: Actions }) {
  const titleId = useId();
  const isSemestral = ev.periodo && (PERIODOS_DESEMPENO.semestrales as readonly string[]).includes(ev.periodo);
  const printing = actions.loading && actions.pendingPrintId === ev.id;
  const date = new Date(ev.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <article aria-labelledby={titleId} className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-2">
          <h3 id={titleId} className="text-sm font-semibold leading-relaxed">{ev.periodo || SAVED_DETAIL.noPeriod}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {ev.periodo && <Badge variant="secondary" className="text-xs">{isSemestral ? DESEMPENO.modes.semestrales : DESEMPENO.modes.mensuales}</Badge>}
            <time dateTime={ev.created_at} className="text-xs text-muted-foreground">{date}</time>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-muted-foreground">{SAVED_DETAIL.score}</p>
          {ev.calificacion_final == null ? <span className="text-xs text-muted-foreground">{SAVED_DETAIL.noScore}</span> : <ScoreBadge score={ev.calificacion_final} />}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Button type="button" variant="ghost" asChild className="min-w-0 flex-1 sm:flex-none" aria-label={`${SAVED_DETAIL.edit}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}>
          <Link href={`/desempeno?evalId=${ev.id}`}><Pencil aria-hidden="true" />{SAVED_DETAIL.edit}</Link>
        </Button>
        <Button type="button" variant="outline" className="min-w-0 flex-1 sm:flex-none" disabled={actions.loading} onClick={() => actions.handlePrint(ev.id)} aria-busy={printing} aria-label={`${SAVED_DETAIL.print}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}>
          {printing ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Printer aria-hidden="true" />}
          {printing ? SAVED_DETAIL.printing : SAVED_DETAIL.print}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => actions.eliminarEvaluacion(ev.id)} aria-label={`${SAVED_DETAIL.remove}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}>
              <Trash2 aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{SAVED_DETAIL.remove}</TooltipContent>
        </Tooltip>
      </div>
    </article>
  );
}
