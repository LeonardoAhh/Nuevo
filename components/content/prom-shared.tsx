"use client"

import React from "react"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { AptitudStatus } from "@/lib/promociones/types"

// ─── Insignia de aptitud ───────────────────────────────────────────────────

const aptitudCfg: Record<AptitudStatus, { label: string; icon: React.ElementType; className: string }> = {
  apto: {
    label: "Apto",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  },
  no_apto: {
    label: "No Apto",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700",
  },
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-muted text-foreground border-border",
  },
  en_revision: {
    label: "En Revisión",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  },
}

export function AptitudBadge({ status }: { status: AptitudStatus }) {
  const cfg = aptitudCfg[status]
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={`gap-1 font-semibold px-2 py-0.5 ${cfg.className}`}>
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
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle size={13} className="text-red-400 flex-shrink-0" />
        )}
        <span>{label}</span>
      </div>
      <div className="text-sm text-right">
        <span className={`font-semibold ${cumple ? "text-emerald-600 dark:text-emerald-400" : "text-destructive dark:text-red-400"}`}>
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
