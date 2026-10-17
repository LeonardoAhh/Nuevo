import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { EvaluationSearchContext } from "./use-evaluation-search"

type SavedEvaluation = NonNullable<EvaluationSearchContext["existingEvaluation"]>

export function ExistingEvaluationNotice({ evaluation }: { evaluation: SavedEvaluation }) {
  return <Card role="status" className="bg-card">
    <CardContent className="flex flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted/40" aria-hidden="true">
        <CheckCircle2 className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold leading-5">Evaluación ya guardada</h2>
        <p className="mt-1 break-words text-sm leading-5 text-foreground">
          {evaluation.nombre || `Empleado #${evaluation.numero}`} · {evaluation.periodo}
        </p>
        <p className="mt-1 text-xs leading-4 text-muted-foreground">
          Este periodo ya está completo. Busca otra persona para continuar.
        </p>
      </div>
      {evaluation.calificacion !== null && <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">Calificación</p>
        <p className="text-xl font-semibold tabular-nums">{Math.round(evaluation.calificacion)}%</p>
      </div>}
    </CardContent>
  </Card>
}
