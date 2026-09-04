import { ChevronDown, Target } from "lucide-react";
import { PositionSelector } from "./position-selector";
import { evaluationStyles, SectionTitle } from "./presentation";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";

const COPY = {
  title: "Catálogo de objetivos",
  description: "Consulta los objetivos SMART de cada puesto.",
  choose: "Selecciona un puesto para consultar sus objetivos.",
  empty: "Sin objetivos para este puesto.",
  specific: "Objetivos específicos definidos en el catálogo.",
  generic: "Objetivos generales correspondientes al tipo de evaluación.",
} as const;

export function ObjectivesCatalog({ context }: { context: SavedEvaluationsContext }) {
  const { puesto, objetivos, hasPuestoObjetivos } = context;
  return (
    <details className="group rounded-lg border bg-card text-card-foreground print:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Target className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block text-sm font-semibold">{COPY.title}</span>
          <span className="block text-xs leading-relaxed text-muted-foreground">{puesto || COPY.description}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid items-start gap-4 border-t p-4 lg:grid-cols-3">
        <PositionSelector context={context} />
        <section className="min-w-0 space-y-3 lg:col-span-2">
          {puesto ? <>
            <div className="space-y-1">
              <SectionTitle>{puesto}</SectionTitle>
              <p className={evaluationStyles.caption}>{hasPuestoObjetivos ? COPY.specific : COPY.generic}</p>
            </div>
            {objetivos.length ? <ol className="divide-y rounded-lg border">
              {objetivos.map(obj => (
                <li key={obj.numero} className="flex items-start gap-3 p-3 text-sm leading-relaxed">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground" aria-hidden="true">{obj.numero}</span>
                  <span className="min-w-0 break-words">{obj.descripcion}</span>
                </li>
              ))}
            </ol> : <p className={evaluationStyles.description}>{COPY.empty}</p>}
          </> : <p className="py-4 text-sm text-muted-foreground">{COPY.choose}</p>}
        </section>
      </div>
    </details>
  );
}
