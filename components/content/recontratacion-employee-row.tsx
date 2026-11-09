import { ChevronLeft, ChevronRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { NuevoIngreso } from "@/lib/hooks"
import { getUrgencyLevel, urgencyLabel } from "@/components/content/recontratacion-logic"
import { StatusBadge } from "@/components/content/recontratacion-ui"
import { cn } from "@/lib/utils"

export function EmpleadoRow({
  record,
  onRevisar,
  onImprimir,
}: {
  record: NuevoIngreso
  onRevisar: (record: NuevoIngreso) => void
  onImprimir: (numero: string) => void
}) {
  const urgency = getUrgencyLevel(record)
  const ariaDescription = urgencyLabel(urgency, record)

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4",
        "transition-colors hover:bg-accent/20",
      )}
      aria-label={`${record.nombre}. ${ariaDescription}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {record.nombre}
          </p>
          {record.puesto && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{record.puesto}</p>
          )}
        </div>
        {record.numero && (
          <span className="shrink-0 pt-0.5 font-sans text-xs tabular-nums text-muted-foreground">
            #{record.numero}
          </span>
        )}
      </div>

      <hr className="border-border" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge urgency={urgency} record={record} />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-3 py-0 text-sm"
            onClick={() => onRevisar(record)}
            aria-label={`Ver detalle de ${record.nombre}`}
          >
            Revisar
          </Button>
          <Button
            size="sm"
            className="h-11 gap-2 px-3 py-0 text-sm"
            onClick={() => record.numero && onImprimir(record.numero)}
            disabled={!record.numero}
            aria-label={record.numero ? `Imprimir formato de ${record.nombre}` : "Sin número asignado"}
            title={record.numero ? undefined : "Sin número asignado"}
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </div>
    </li>
  )
}

export function SkeletonRow() {
  return (
    <li
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4"
      aria-hidden="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-20 rounded-md" />
          <Skeleton className="h-11 w-24 rounded-md" />
        </div>
      </div>
    </li>
  )
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Paginación">
      <p className="text-sm tabular-nums text-muted-foreground">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-11 gap-2 px-3 py-0 text-sm"
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="px-2 text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-11 gap-2 px-3 py-0 text-sm"
          disabled={page >= pageCount}
          onClick={onNext}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
