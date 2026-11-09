import { useId, useState } from "react"
import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/hooks"
import { LFT_VENTANA_DIAS } from "@/lib/lft/articulo47"
import type { LftCandidato, LftOrigen } from "@/lib/hooks/useLftArticulo47"
import { cn } from "@/lib/utils"

const ORIGEN_LABEL: Record<LftOrigen, string> = {
  planta: "Planta",
  nuevo_ingreso: "Nuevo ingreso",
}

const ORIGEN_BADGE_CLASS: Record<LftOrigen, string> = {
  planta: "bg-muted text-muted-foreground border-border",
  nuevo_ingreso: "bg-primary/10 text-primary border-primary/30",
}

export function LftSkeletonCard() {
  return (
    <li
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4"
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-4 w-2/3" />
    </li>
  )
}

export function CandidatoCard({ candidato }: { candidato: LftCandidato }) {
  const [expanded, setExpanded] = useState(false)
  const fechasId = useId()
  const ventana = candidato.evaluacion.ventana!

  return (
    <li
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/20"
      data-testid={`lft-card-${candidato.numero}`}
      aria-label={`${candidato.nombre}, candidato a baja por LFT Art. 47`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {candidato.nombre}
          </p>
          {candidato.puesto && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{candidato.puesto}</p>
          )}
        </div>
        <span className="shrink-0 pt-0.5 font-sans text-xs tabular-nums text-muted-foreground">
          #{candidato.numero}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
            ORIGEN_BADGE_CLASS[candidato.origen],
          )}
        >
          {ORIGEN_LABEL[candidato.origen]}
        </span>
      </div>

      <hr className="border-border" />

      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <CalendarRange className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p>
            <span className="font-semibold tabular-nums text-foreground">{ventana.conteo}</span>{" "}
            faltas injustificadas en{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {LFT_VENTANA_DIAS} días
            </span>
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="-mx-1 h-11 justify-start gap-2 px-3 py-0 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={fechasId}
        data-testid={`lft-toggle-${candidato.numero}`}
      >
        {expanded ? (
          <ChevronUp className="size-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4" aria-hidden="true" />
        )}
        {expanded ? "Ocultar fechas" : `Ver fechas (${candidato.evaluacion.totalFaltas} totales)`}
      </Button>

      {expanded && (
        <div
          id={fechasId}
          className="space-y-3 rounded-md border border-border bg-muted/30 p-3"
          data-testid={`lft-fechas-${candidato.numero}`}
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Faltas en la ventana detectada
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(ventana.inicio)} → {formatDate(ventana.fin)}
          </p>
          <ul className="flex flex-wrap gap-2">
            {ventana.fechas.map((fecha) => (
              <li
                key={fecha}
                className="rounded-md bg-destructive/10 px-2 py-1 font-sans text-xs tabular-nums text-destructive"
              >
                {formatDate(fecha)}
              </li>
            ))}
          </ul>
          {candidato.evaluacion.fechasFaltas.length > ventana.fechas.length && (
            <>
              <p className="border-t border-border pt-3 text-xs font-medium uppercase text-muted-foreground">
                Otras faltas en el histórico
              </p>
              <ul className="flex flex-wrap gap-2">
                {candidato.evaluacion.fechasFaltas
                  .filter((fecha) => !ventana.fechas.includes(fecha))
                  .map((fecha) => (
                    <li
                      key={fecha}
                      className="rounded-md bg-muted px-2 py-1 font-sans text-xs tabular-nums text-muted-foreground"
                    >
                      {formatDate(fecha)}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  )
}
