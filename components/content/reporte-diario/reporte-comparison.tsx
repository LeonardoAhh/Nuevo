"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { ReporteDiarioSummary } from "@/lib/hooks/useReporteDiario"

interface ReporteComparisonProps {
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
    if (current < previous) return <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />
}

export default function ReporteComparison({ summaries }: ReporteComparisonProps) {
    if (summaries.length < 2) return null

    const sorted = [...summaries].sort((a, b) => a.mes.localeCompare(b.mes))

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/40 border-b border-border px-5 py-4">
                <p className="text-sm font-semibold text-foreground">Comparativa mensual</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Evolución de incidencias y asistencia mes a mes.
                </p>
            </div>

            <div className="p-4">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    {sorted.map((s, i) => {
                        const prev = i > 0 ? sorted[i - 1] : null
                        const incDiff = prev ? s.total_incidencias - prev.total_incidencias : 0
                        const ausDiff = prev ? s.pct_ausentismo - prev.pct_ausentismo : 0

                        return (
                            <div
                                key={s.id}
                                className="rounded-2xl border border-border p-4 bg-background shadow-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                                    {formatShortMes(s.mes)}
                                </p>
                                <div className="grid gap-2 text-sm text-foreground">
                                    <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>Empleados</span>
                                        <span className="font-semibold">{s.total_empleados}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>Días disponibles</span>
                                        <span className="font-semibold">{s.dias_disponibles}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>Total ausentismo</span>
                                        <span className={cn("font-semibold", s.total_ausentismo > 0 ? "text-destructive" : "")}>
                                            {s.total_ausentismo}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>% Ausentismo</span>
                                        <span className={cn("font-semibold", s.pct_ausentismo > 2.5 ? "text-destructive" : "text-emerald-600")}>
                                            {s.pct_ausentismo.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>Incidencias</span>
                                        <span className={cn("font-semibold", s.total_incidencias > 50 ? "text-destructive" : "")}>
                                            {s.total_incidencias}
                                        </span>
                                    </div>
                                    {prev && (
                                        <>
                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                <span>Tend. incidencias</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <TrendIcon current={s.total_incidencias} previous={prev.total_incidencias} />
                                                    <span className={cn("text-xs tabular-nums font-semibold", incDiff > 0 ? "text-destructive" : incDiff < 0 ? "text-emerald-600" : "text-muted-foreground")}>
                                                        {incDiff > 0 ? "+" : ""}{incDiff}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                <span>Tend. ausentismo</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <TrendIcon current={s.pct_ausentismo} previous={prev.pct_ausentismo} />
                                                    <span className={cn("text-xs tabular-nums font-semibold", ausDiff > 0 ? "text-destructive" : ausDiff < 0 ? "text-emerald-600" : "text-muted-foreground")}>
                                                        {ausDiff > 0 ? "+" : ""}{ausDiff.toFixed(2)}%
                                                    </span>
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
