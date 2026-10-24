import { useId, useState } from "react";
import Link from "next/link";
import { Pencil, Printer, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { esPeriodoSemestral } from "@/lib/desempeno/elegibilidad";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";
import { SAVED_DETAIL } from "./saved-detail-copy";
import { HITOS_NUEVO_INGRESO } from "@/lib/desempeno/hitos-nuevo-ingreso";

type Evaluation = NonNullable<SavedEvaluationsContext["empleadoSel"]>["evals"][number];
type Actions = Pick<SavedEvaluationsContext, "loading" | "pendingPrintId" | "handlePrint" | "eliminarEvaluacion">;

export function SavedEvaluationCard({ evaluation: ev, actions }: { evaluation: Evaluation; actions: Actions }) {
  const titleId = useId();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSemestral = Boolean(ev.periodo && esPeriodoSemestral(ev.periodo));
  const printing = actions.loading && actions.pendingPrintId === ev.id;
  const date = new Date(ev.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  const score = ev.calificacion_final == null ? null : Math.min(100, Math.max(0, ev.calificacion_final)).toFixed(0);
  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (deleting) return;
    setDeleting(true);
    const deleted = await actions.eliminarEvaluacion(ev.id);
    if (!deleted) {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <article aria-labelledby={titleId} className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <h3 id={titleId} className="break-words text-sm font-medium leading-5 text-foreground">{ev.periodo || SAVED_DETAIL.noPeriod}{ev.hito_nuevo_ingreso ? ` · ${HITOS_NUEVO_INGRESO[ev.hito_nuevo_ingreso - 1].etiqueta}` : ""}</h3>
          <p className="text-xs leading-4 text-muted-foreground">
            {ev.periodo && <>{isSemestral ? DESEMPENO.modes.semestrales : DESEMPENO.modes.mensuales}{" · "}</>}
            <time dateTime={ev.created_at}>{date}</time>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs leading-4 text-muted-foreground">{SAVED_DETAIL.score}</p>
          <p className="text-sm font-medium leading-5 tabular-nums text-foreground" aria-label={score == null ? SAVED_DETAIL.noScore : `Calificación final: ${score} de 100`}>
            {score == null ? SAVED_DETAIL.noScore : `${score}%`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Button type="button" variant="ghost" asChild className="min-w-0 flex-1 sm:flex-none" aria-label={`${SAVED_DETAIL.edit}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}>
          <Link href={`/desempeno?evalId=${ev.id}`}><Pencil aria-hidden="true" />{SAVED_DETAIL.edit}</Link>
        </Button>
        <Button type="button" className="min-w-0 flex-1 sm:flex-none" disabled={actions.loading} onClick={() => actions.handlePrint(ev.id)} aria-busy={printing} aria-label={`${SAVED_DETAIL.print}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}>
          {printing ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Printer aria-hidden="true" />}
          {printing ? SAVED_DETAIL.printing : SAVED_DETAIL.print}
        </Button>
        <Tooltip open={confirmingDelete ? false : undefined}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={confirmingDelete ? "destructive" : "ghost"}
              size={confirmingDelete ? "sm" : "icon"}
              className={confirmingDelete ? "ml-auto min-h-11 shrink-0" : "ml-auto min-h-11 min-w-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}
              disabled={deleting}
              onClick={handleDelete}
              onBlur={() => { if (!deleting) setConfirmingDelete(false); }}
              onKeyDown={event => { if (event.key === "Escape") setConfirmingDelete(false); }}
              aria-busy={deleting}
              aria-label={confirmingDelete ? `Confirmar eliminación: ${ev.periodo || SAVED_DETAIL.noPeriod}` : `${SAVED_DETAIL.remove}: ${ev.periodo || SAVED_DETAIL.noPeriod}`}
            >
              {deleting ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : confirmingDelete ? "Confirmar" : <Trash2 aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{SAVED_DETAIL.remove}</TooltipContent>
        </Tooltip>
      </div>
    </article>
  );
}
