"use client"

import { useMemo } from "react"
import { Users, TrendingDown, CalendarX, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { isIncidence } from "./helpers"
import type { ReporteRow } from "./types"

interface ReporteKpiDashboardProps {
    selectedRows: ReporteRow[]
    dayHeaders: string[]
    currentMonth: string
}

interface KpiCard {
    label: string
    value: string | number
    sub?: string
    icon: React.ReactNode
    tone?: "default" | "warning" | "destructive"
}

export default function ReporteKpiDashboard({
    selectedRows,
    dayHeaders,
    currentMonth,
}: ReporteKpiDashboardProps) {
    const kpis = useMemo(() => {
        if (!selectedRows.length || !currentMonth) return null

        const totalEmpleados = selectedRows.length
        let totalIncidencias = 0
        let totalAsistencias = 0
        let totalDaysTracked = 0
        const incidentsByDay: Record<string, number> = {}
        const incidentsByArea: Record<string, number> = {}

        for (const row of selectedRows) {
            for (const day of dayHeaders) {
                const code = row.days[day]
                if (!code || code === "-" || code === "X") continue
                totalDaysTracked++
                if (code === "A") {
                    totalAsistencias++
                } else if (isIncidence(code)) {
                    totalIncidencias++
                    incidentsByDay[day] = (incidentsByDay[day] ?? 0) + 1
                    incidentsByArea[row.area] = (incidentsByArea[row.area] ?? 0) + 1
                }
            }
        }

        const tasaAsistencia = totalDaysTracked > 0
            ? Math.round((totalAsistencias / totalDaysTracked) * 100)
            : 0

        let worstDay = ""
        let worstDayCount = 0
        for (const [day, count] of Object.entries(incidentsByDay)) {
            if (count > worstDayCount) {
                worstDay = day
                worstDayCount = count
            }
        }

        let worstArea = ""
        let worstAreaCount = 0
        for (const [area, count] of Object.entries(incidentsByArea)) {
            if (count > worstAreaCount) {
                worstArea = area
                worstAreaCount = count
            }
        }

        return { totalEmpleados, totalIncidencias, tasaAsistencia, worstDay, worstDayCount, worstArea, worstAreaCount }
    }, [selectedRows, dayHeaders, currentMonth])

    if (!kpis) return null

    const cards: KpiCard[] = [
        {
            label: "Empleados",
            value: kpis.totalEmpleados,
            icon: <Users className="w-5 h-5" />,
        },
        {
            label: "Tasa de asistencia",
            value: `${kpis.tasaAsistencia}%`,
            sub: "Días con 'A' / total días registrados",
            icon: <TrendingDown className="w-5 h-5" />,
            tone: kpis.tasaAsistencia < 80 ? "destructive" : kpis.tasaAsistencia < 90 ? "warning" : "default",
        },
        {
            label: "Total incidencias",
            value: kpis.totalIncidencias,
            icon: <CalendarX className="w-5 h-5" />,
            tone: kpis.totalIncidencias > 0 ? "warning" : "default",
        },
        {
            label: "Día con más incidencias",
            value: kpis.worstDay ? `Día ${parseInt(kpis.worstDay, 10)}` : "—",
            sub: kpis.worstDay ? `${kpis.worstDayCount} incidencias` : undefined,
            icon: <CalendarX className="w-5 h-5" />,
            tone: kpis.worstDayCount > 5 ? "destructive" : kpis.worstDayCount > 0 ? "warning" : "default",
        },
        {
            label: "Área con más incidencias",
            value: kpis.worstArea || "—",
            sub: kpis.worstArea ? `${kpis.worstAreaCount} incidencias` : undefined,
            icon: <MapPin className="w-5 h-5" />,
            tone: kpis.worstAreaCount > 10 ? "destructive" : kpis.worstAreaCount > 0 ? "warning" : "default",
        },
    ]

    return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={cn(
                        "rounded-xl border p-4 bg-card shadow-sm",
                        card.tone === "destructive" && "border-destructive/30",
                        card.tone === "warning" && "border-warning/30",
                        (!card.tone || card.tone === "default") && "border-border",
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {card.label}
                        </span>
                        <span className={cn(
                            "text-muted-foreground/60",
                            card.tone === "destructive" && "text-destructive/60",
                            card.tone === "warning" && "text-warning/60",
                        )}>
                            {card.icon}
                        </span>
                    </div>
                    <p className={cn(
                        "text-xl font-bold text-foreground truncate",
                        card.tone === "destructive" && "text-destructive",
                    )}>
                        {card.value}
                    </p>
                    {card.sub && (
                        <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                    )}
                </div>
            ))}
        </div>
    )
}
