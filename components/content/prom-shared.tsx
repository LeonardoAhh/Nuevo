"use client"

import React from "react"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BadgeProps } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { AptitudStatus } from "@/lib/promociones/types"

// ─── Insignia de aptitud ───────────────────────────────────────────────────

const aptitudCfg: Record<AptitudStatus, { label: string; icon: React.ElementType; variant: NonNullable<BadgeProps['variant']> }> = {
  apto:        { label: "Apto",        icon: CheckCircle2,  variant: "success" },
  no_apto:     { label: "No Apto",     icon: XCircle,       variant: "error" },
  pendiente:   { label: "Pendiente",   icon: Clock,         variant: "secondary" },
  en_revision: { label: "En Revisión", icon: AlertTriangle, variant: "warning" },
}

export function AptitudBadge({ status }: { status: AptitudStatus }) {
  const cfg = aptitudCfg[status]
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant} className="font-semibold">
      <Icon size={12} />
      {cfg.label}
    </Badge>
  )
}

// ─── Indicador de criterio individual ──────────────────────────────────────

export function CriterioRow({
  label,
  cumple,
  valor,
  minimo,
  unidad = "",
}: {
  label: string
  cumple: boolean
  valor: string | number
  minimo: string | number
  unidad?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {cumple ? (
          <CheckCircle2 size={13} className="text-success flex-shrink-0" />
        ) : (
          <XCircle size={13} className="text-destructive flex-shrink-0" />
        )}
        <span>{label}</span>
      </div>
      <div className="text-sm text-right">
        <span className={`font-semibold ${cumple ? "text-success" : "text-destructive"}`}>
          {valor}{unidad}
        </span>
        <span className="text-muted-foreground ml-1 text-xs">/ mín {minimo}{unidad}</span>
      </div>
    </div>
  )
}

// ─── Tarjeta de resumen ────────────────────────────────────────────────────

export function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <Card className="border">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
