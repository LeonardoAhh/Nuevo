import { CheckCircle2, Link2, AlertTriangle, HelpCircle } from "lucide-react"

export const STATUS_META = {
  exact:       { label: "Exacto",      color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     Icon: CheckCircle2 },
  alias:       { label: "Por alias",   color: "text-info",        bg: "bg-info/10",        border: "border-info/30",        Icon: Link2 },
  approximate: { label: "Aproximado",  color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     Icon: AlertTriangle },
  unknown:     { label: "Desconocido", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", Icon: HelpCircle },
} as const
