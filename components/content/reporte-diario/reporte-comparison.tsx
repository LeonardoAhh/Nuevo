"use client"

import { cn } from "@/lib/utils"
import { BarChart3, ChevronRight, X, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import type { ReporteDiarioSummary } from "@/lib/hooks/useReporteDiario"

interface ReporteComparisonDialogProps {
    summaries: ReporteDiarioSummary[]
}

const MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

function formatShortMes(ym: string) {
    const [year, month] = ym.split("-")
    return `${MONTH_NAMES[parseInt(month, 10) - 1] ?? month} ${year}`
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
    if (current > previous) return <TrendingUp className="w-3.5 h-3.5 text-destructive" />
    if (current < previous) return <TrendingDown className="w-3.5 h-3.5 text-success" />
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />
}

export default function ReporteComparisonDialog({ summaries }: ReporteComparisonDialogProps) {
    if (summaries.length < 2) return null

    const sorted = [...summaries].sort((a, b) => a.mes.localeCompare(b.mes))

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Comparativa mensual</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary shrink-0" />
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-5xl bg-card p-0 overflow-hidden sm:rounded-2xl border-border shadow-2xl" hideClose>
                {/* Header */}
                <div className="bg-muted/40 border-b border-border px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                        <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                            Comparativa mensual
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Evolución de incidencias y asistencia mes a mes.
                        </p>
                    </div>
                    <DialogClose className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-shrink-0">
                        <X className="w-5 h-5" />
                    </DialogClose>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-thin bg-background/50">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {sorted.map((s, i) => {
                            const prev = i > 0 ? sorted[i - 1] : null
                            const incDiff = prev ? s.total_incidencias - prev.total_incidencias : 0
                            const ausDiff = prev ? s.pct_ausentismo - prev.pct_ausentismo : 0

                            return (
                                <div
                                    key={s.id}
                                    className="rounded-xl border border-border p-4 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20"
                                >
                                    {/* Header del mes */}
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                            {formatShortMes(s.mes)}
                                        </p>
                                        {prev && (
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                incDiff < 0
                                                    ? "bg-success/10 text-success border-success/20"
                                                    : incDiff > 0
                                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                                        : "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {incDiff > 0 ? "+" : ""}{incDiff} inc.
                                            </span>
                                        )}
                                    </div>

                                    {/* Métricas */}
                                    <div className="space-y-2 text-sm">
                                        <MetricRow label="Empleados" value={s.total_empleados} />
                                        <MetricRow label="Días disponibles" value={s.dias_disponibles} />
                                        
                                        <MetricRow 
                                            label="Total ausentismo" 
                                            value={s.total_ausentismo}
                                            valueClass={s.total_ausentismo > 0 ? "text-destructive font-bold" : "text-foreground font-semibold"}
                                        />
                                        
                                        <MetricRow 
                                            label="% Ausentismo" 
                                            value={`${s.pct_ausentismo.toFixed(2)}%`}
                                            valueClass={cn(
                                                "font-bold",
                                                s.pct_ausentismo > 2.5 ? "text-destructive" : "text-success"
                                            )}
                                            showBar
                                            barValue={s.pct_ausentismo}
                                            barThreshold={2.5}
                                        />
                                        
                                        <MetricRow 
                                            label="Incidencias" 
                                            value={s.total_incidencias}
                                            valueClass={s.total_incidencias > 50 ? "text-destructive font-bold" : "text-foreground font-semibold"}
                                        />

                                        {/* Tendencias */}
                                        {prev && (
                                            <div className="pt-2.5 mt-2 border-t border-border/40 space-y-2">
                                                <TrendRow 
                                                    label="Tend. incidencias"
                                                    diff={incDiff}
                                                    current={s.total_incidencias}
                                                    previous={prev.total_incidencias}
                                                    suffix=""
                                                />
                                                <TrendRow 
                                                    label="Tend. ausentismo"
                                                    diff={ausDiff}
                                                    current={s.pct_ausentismo}
                                                    previous={prev.pct_ausentismo}
                                                    suffix="%"
                                                    decimals={2}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────────

function MetricRow({ 
    label, 
    value, 
    valueClass = "text-foreground font-semibold",
    showBar,
    barValue,
    barThreshold
}: { 
    label: string
    value: string | number
    valueClass?: string
    showBar?: boolean
    barValue?: number
    barThreshold?: number
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={cn("text-sm tabular-nums text-right", valueClass)}>{value}</span>
            </div>
            {showBar && barValue !== undefined && (
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            barValue > (barThreshold || 2.5) * 2 ? "bg-destructive" :
                            barValue > (barThreshold || 2.5) ? "bg-warning" : "bg-success"
                        )}
                        style={{ width: `${Math.min(barValue * 10, 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function TrendRow({ 
    label, 
    diff, 
    current, 
    previous, 
    suffix = "",
    decimals = 0
}: { 
    label: string
    diff: number
    current: number
    previous: number
    suffix?: string
    decimals?: number
}) {
    const formattedDiff = decimals > 0 ? diff.toFixed(decimals) : String(diff)
    
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="inline-flex items-center gap-1.5">
                <TrendIcon current={current} previous={previous} />
                <span className={cn(
                    "text-xs tabular-nums font-semibold",
                    diff > 0 ? "text-destructive" : diff < 0 ? "text-success" : "text-muted-foreground"
                )}>
                    {diff > 0 ? "+" : ""}{formattedDiff}{suffix}
                </span>
            </span>
        </div>
    )
}
