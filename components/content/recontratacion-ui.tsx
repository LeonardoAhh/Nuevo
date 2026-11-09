import type { ReactNode } from "react"
import {
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { daysFromToday, formatDate, type NuevoIngreso } from "@/lib/hooks"
import {
  URGENCY_THRESHOLDS,
  type Recomendacion,
  type UrgencyLevel,
} from "@/components/content/recontratacion-logic"

export const RECO_META: Record<
  Recomendacion,
  { label: string; icon: LucideIcon; classes: string }
> = {
  viable: {
    label: "Viable",
    icon: CheckCircle2,
    classes: "rounded-md bg-success/10 text-foreground border-success/30",
  },
  revisar: {
    label: "Revisar",
    icon: AlertTriangle,
    classes: "rounded-md bg-warning/10 text-foreground border-warning/30",
  },
  "no-viable": {
    label: "No recomendado",
    icon: AlertCircle,
    classes: "rounded-md bg-destructive/10 text-destructive border-destructive/30",
  },
  "sin-datos": {
    label: "Sin datos",
    icon: ShieldQuestion,
    classes: "rounded-md bg-muted text-muted-foreground border-border",
  },
}

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  expired: "text-destructive",
  critical: "text-destructive",
  warning: "text-foreground",
  normal: "text-muted-foreground",
  indefinite: "text-muted-foreground",
}

const URGENCY_PILL_BG: Record<"critical" | "warning", string> = {
  critical: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-foreground",
}

export function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-sans text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 font-sans text-sm font-medium uppercase text-foreground">
      {children}
    </h3>
  )
}

export function StatusBadge({
  urgency,
  record,
}: {
  urgency: UrgencyLevel
  record: NuevoIngreso
}) {
  const diff = daysFromToday(record.termino_contrato)

  if (urgency === "indefinite") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        Indeterminado
      </span>
    )
  }

  const label =
    urgency === "expired"
      ? `Venció ${formatDate(record.termino_contrato)}`
      : record.termino_contrato
        ? `Término ${formatDate(record.termino_contrato)}`
        : "Sin término"

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-sm", URGENCY_TEXT[urgency])}>
      <CalendarClock
        className={cn(
          "size-4 shrink-0",
          urgency === "warning" && "text-warning",
          urgency === "critical" && "text-destructive",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
      {diff != null && diff >= 0 && diff <= URGENCY_THRESHOLDS.warning && (
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-xs font-medium",
            urgency === "critical" ? URGENCY_PILL_BG.critical : URGENCY_PILL_BG.warning,
          )}
        >
          {diff === 0 ? "hoy" : `${diff}d`}
        </span>
      )}
    </span>
  )
}
