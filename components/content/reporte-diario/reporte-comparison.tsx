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

function AttendanceTrendIcon({ current, previous }: { current: number; previous: number }) {
    if (current > previous) return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
    if (current < previous) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />
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

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Mes
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Empleados
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Incidencias
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Tendencia
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Asistencia
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Tendencia
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.map((s, i) => {
                            const prev = i > 0 ? sorted[i - 1] : null
                            const incDiff = prev ? s.total_incidencias - prev.total_incidencias : 0
                            const attDiff = prev ? s.tasa_asistencia - prev.tasa_asistencia : 0

                            return (
                                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                        {formatShortMes(s.mes)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {s.total_empleados}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                        <span className={cn(
                                            s.total_incidencias > 50 ? "text-destructive" : "text-foreground",
                                        )}>
                                            {s.total_incidencias}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {prev ? (
                                            <span className="inline-flex items-center gap-1">
                                                <TrendIcon current={s.total_incidencias} previous={prev.total_incidencias} />
                                                <span className={cn(
                                                    "text-xs tabular-nums",
                                                    incDiff > 0 ? "text-destructive" : incDiff < 0 ? "text-emerald-600" : "text-muted-foreground",
                                                )}>
                                                    {incDiff > 0 ? "+" : ""}{incDiff}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/40">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <span className={cn(
                                            "font-semibold",
                                            s.tasa_asistencia < 80 ? "text-destructive" : s.tasa_asistencia < 90 ? "text-warning" : "text-foreground",
                                        )}>
                                            {s.tasa_asistencia.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {prev ? (
                                            <span className="inline-flex items-center gap-1">
                                                <AttendanceTrendIcon current={s.tasa_asistencia} previous={prev.tasa_asistencia} />
                                                <span className={cn(
                                                    "text-xs tabular-nums",
                                                    attDiff > 0 ? "text-emerald-600" : attDiff < 0 ? "text-destructive" : "text-muted-foreground",
                                                )}>
                                                    {attDiff > 0 ? "+" : ""}{attDiff.toFixed(1)}%
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/40">—</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
