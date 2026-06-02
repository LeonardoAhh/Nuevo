import React from "react"
import { CheckCircle2, AlertTriangle, CalendarCheck, XCircle, Clock } from "lucide-react"
import { formatDate, daysFromToday, evalStatus } from "@/lib/hooks"
import type { EvalStatus } from "@/lib/hooks"

// ─────────────────────────────────────────────────────────────────────────────
// Metadata para estados de evaluación
// ─────────────────────────────────────────────────────────────────────────────

export const EVAL_STATUS_META: Record<EvalStatus, { label: string; icon: React.ElementType; classes: string }> = {
  completada: { label: 'Completada', icon: CheckCircle2, classes: 'text-success' },
  proxima: { label: 'Próxima', icon: AlertTriangle, classes: 'text-warning' },
  hoy: { label: 'Hoy', icon: CalendarCheck, classes: 'text-warning' },
  vencida: { label: 'Vencida', icon: XCircle, classes: 'text-destructive' },
  pendiente: { label: 'Pendiente', icon: Clock, classes: 'text-muted-foreground' },
}

// ─────────────────────────────────────────────────────────────────────────────
// EvalBadge — indicador visual de estado de evaluación
// ─────────────────────────────────────────────────────────────────────────────

export function EvalBadge({ fecha, calificacion }: { fecha: string | null; calificacion: number | null }) {
  const status = evalStatus(fecha, calificacion)
  const { icon: Icon, classes } = EVAL_STATUS_META[status]
  const diff = daysFromToday(fecha)

  return (
    <div className={`flex flex-col items-center gap-0.5 ${classes}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{formatDate(fecha)}</span>
      {calificacion != null && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${calificacion >= 70 ? 'bg-success/10 text-success'
          : 'bg-destructive/10 text-destructive'
          }`}>{calificacion}</span>
      )}
      {calificacion == null && diff !== null && diff >= 0 && (
        <span className="text-xs opacity-70">{diff === 0 ? 'hoy' : `en ${diff}d`}</span>
      )}
      {calificacion == null && diff !== null && diff < 0 && (
        <span className="text-xs opacity-70">{Math.abs(diff)}d atrás</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ContratoTerminoBadge — indicador de vencimiento de contrato
// ─────────────────────────────────────────────────────────────────────────────

export function ContratoTerminoBadge({ fecha, indeterminado }: { fecha: string | null; indeterminado?: boolean }) {
  const diff = daysFromToday(fecha)
  if (diff === null) return <span className="text-xs text-muted-foreground">—</span>
  const urgent = diff <= 10
  const past = diff < 0
  return (
    <div className={`text-xs font-medium ${past && !indeterminado ? 'text-destructive' : urgent && !indeterminado ? 'text-warning' : 'text-muted-foreground'}`}>
      <div>{formatDate(fecha)}</div>
      {!indeterminado && (
        <div className="opacity-70">
          {past ? `Vencido hace ${Math.abs(diff)}d` : diff === 0 ? 'Hoy' : `En ${diff} días`}
        </div>
      )}
    </div>
  )
}
