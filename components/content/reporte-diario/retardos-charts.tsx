"use client"

import { useMemo, useState } from "react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LineChart, Line,
} from "recharts"
import { UserCheck, AlertTriangle, Zap, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { PunchAnalysis } from "./retardos-types"
import { PUNCH_STATUS_LABELS } from "./retardos-constants"

const STATUS_CHART_COLORS: Record<string, string> = {
    on_time: "hsl(var(--success))",
    late: "hsl(var(--warning))",
    missing_punch: "hsl(var(--destructive))",
    no_schedule: "hsl(var(--muted-foreground) / 0.6)",
    day_off: "hsl(var(--muted-foreground))",
    incidence: "hsl(var(--info))",
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

type RangoKey = "all" | "7" | "30"

const RANGO_LABELS: Record<RangoKey, string> = {
    all: "Todo el periodo",
    "7": "Últimos 7 días",
    "30": "Últimos 30 días",
}

interface Props {
    analyses: PunchAnalysis[]
}

export default function RetardosCharts({ analyses }: Props) {
    const [rango, setRango] = useState<RangoKey>("all")
    const [turnoFilter, setTurnoFilter] = useState<string>("all")

    const availableTurnos = useMemo(
        () => Array.from(new Set(analyses.map((a) => a.turno))).sort((a, b) => a - b),
        [analyses],
    )

    // Aplica filtros de rango + turno antes de cualquier cómputo
    const filtered = useMemo(() => {
        let result = analyses
        if (rango !== "all") {
            const dates = result.map((a) => a.fecha).filter(Boolean).sort()
            if (dates.length > 0) {
                const latest = new Date(dates[dates.length - 1] + "T12:00:00")
                const cutoff = new Date(latest)
                cutoff.setDate(cutoff.getDate() - parseInt(rango, 10))
                result = result.filter((a) => {
                    if (!a.fecha) return false
                    return new Date(a.fecha + "T12:00:00") >= cutoff
                })
            }
        }
        if (turnoFilter !== "all") {
            result = result.filter((a) => String(a.turno) === turnoFilter)
        }
        return result
    }, [analyses, rango, turnoFilter])

    const working = useMemo(
        () => filtered.filter((a) => a.status !== "day_off" && a.status !== "incidence"),
        [filtered],
    )

    // ── KPIs globales ──
    const kpis = useMemo(() => {
        const total = working.length
        const onTime = working.filter((a) => a.status === "on_time").length
        const pct = total > 0 ? Math.round((onTime / total) * 100) : 0
        const retardosTotales = working.filter((a) => a.status === "late").length
        const extraTotalMin = working.reduce((sum, a) => sum + (a.minutos_extra || 0), 0)
        const empleados = new Set(working.map((a) => a.numero_empleado)).size
        return { pct, retardosTotales, extraTotalMin, empleados }
    }, [working])

    // ── Bar chart: retardos por turno ──
    const retardosByTurno = useMemo(() => {
        const map = new Map<number, { turno: number; retardos: number; total: number }>()
        for (const a of working) {
            const entry = map.get(a.turno) ?? { turno: a.turno, retardos: 0, total: 0 }
            entry.total++
            if (a.status === "late") entry.retardos++
            map.set(a.turno, entry)
        }
        return Array.from(map.values()).sort((a, b) => a.turno - b.turno)
    }, [working])

    // ── Line chart: puntualidad por día de semana ──
    const puntualidadByDay = useMemo(() => {
        const map = new Map<number, { total: number; onTime: number }>()
        for (const a of working) {
            if (!a.fecha) continue
            const day = new Date(a.fecha + "T12:00:00").getDay()
            const entry = map.get(day) ?? { total: 0, onTime: 0 }
            entry.total++
            if (a.status === "on_time") entry.onTime++
            map.set(day, entry)
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a - b)
            .map(([day, data]) => ({
                dia: DAY_NAMES[day],
                puntualidad: data.total > 0 ? Math.round((data.onTime / data.total) * 100) : 0,
            }))
    }, [working])

    // ── Pie chart: distribución de status ──
    const statusDistribution = useMemo(() => {
        const map = new Map<string, number>()
        for (const a of filtered) {
            map.set(a.status, (map.get(a.status) ?? 0) + 1)
        }
        return Array.from(map.entries()).map(([status, count]) => ({
            name: PUNCH_STATUS_LABELS[status] || status,
            value: count,
            color: STATUS_CHART_COLORS[status] || "hsl(var(--muted-foreground))",
        }))
    }, [filtered])

    // ── Heatmap: retardos por empleado × día ──
    const heatmapData = useMemo(() => {
        const emps = new Map<string, { nombre: string; days: Map<string, number> }>()
        for (const a of working) {
            if (a.status !== "late") continue
            const entry = emps.get(a.numero_empleado) ?? { nombre: a.nombre, days: new Map() }
            entry.days.set(a.fecha, (entry.days.get(a.fecha) ?? 0) + a.minutos_retardo)
            emps.set(a.numero_empleado, entry)
        }
        const dates = Array.from(new Set(working.map((a) => a.fecha))).sort()
        const rows = Array.from(emps.entries()).map(([id, data]) => ({
            id,
            nombre: data.nombre.length > 20 ? data.nombre.slice(0, 20) + "…" : data.nombre,
            ...Object.fromEntries(dates.map((d) => [d, data.days.get(d) ?? 0])),
        }))
        return { rows, dates }
    }, [working])

    const hasData = filtered.length > 0

    return (
        <div className="space-y-5">
            {/* ── Toolbar: filtros ────────────────────────────────── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={rango} onValueChange={(v) => setRango(v as RangoKey)}>
                    <SelectTrigger className="h-9 w-full text-sm sm:w-52">
                        <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                        <SelectValue placeholder="Rango" />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(RANGO_LABELS) as RangoKey[]).map((k) => (
                            <SelectItem key={k} value={k}>{RANGO_LABELS[k]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {availableTurnos.length > 1 && (
                    <Select value={turnoFilter} onValueChange={setTurnoFilter}>
                        <SelectTrigger className="h-9 w-full text-sm sm:w-44">
                            <SelectValue placeholder="Turno" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los turnos</SelectItem>
                            {availableTurnos.map((t) => (
                                <SelectItem key={t} value={String(t)}>Turno {t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* ── KPI strip ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard icon={UserCheck} label="Puntualidad global" value={`${kpis.pct}%`} tone={kpis.pct >= 90 ? "text-success" : kpis.pct >= 70 ? "text-warning" : "text-destructive"} />
                <KpiCard icon={AlertTriangle} label="Retardos" value={String(kpis.retardosTotales)} tone={kpis.retardosTotales > 0 ? "text-warning" : "text-success"} />
                <KpiCard icon={Zap} label="T. extra (min)" value={String(kpis.extraTotalMin)} tone={kpis.extraTotalMin > 0 ? "text-info" : "text-muted-foreground"} />
                <KpiCard icon={Users} label="Empleados" value={String(kpis.empleados)} tone="text-foreground" />
            </div>

            {!hasData ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No hay datos para graficar.
                </p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Bar: Retardos por turno */}
                    <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="px-5 py-3 border-b border-border">
                            <p className="text-sm font-semibold">Retardos por turno</p>
                            <p className="text-xs text-muted-foreground">
                                {kpis.retardosTotales} retardos en {retardosByTurno.length} turnos
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={retardosByTurno}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis dataKey="turno" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" label={{ value: "Turno", position: "insideBottom", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            backgroundColor: "hsl(var(--popover))",
                                            color: "hsl(var(--popover-foreground))",
                                            border: "1px solid hsl(var(--border))",
                                        }}
                                        formatter={(value: number, name: string) => [value, name === "retardos" ? "Retardos" : "Total"]}
                                    />
                                    <Bar dataKey="retardos" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Retardos" />
                                    <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Total registros" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Line: Puntualidad por día */}
                    <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="px-5 py-3 border-b border-border">
                            <p className="text-sm font-semibold">Puntualidad por día de semana</p>
                            <p className="text-xs text-muted-foreground">
                                Promedio diario sobre {working.length} registros laborables
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={puntualidadByDay}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" domain={[0, 100]} unit="%" />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            backgroundColor: "hsl(var(--popover))",
                                            color: "hsl(var(--popover-foreground))",
                                            border: "1px solid hsl(var(--border))",
                                        }}
                                        formatter={(value: number) => [`${value}%`, "Puntualidad"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="puntualidad"
                                        stroke="hsl(var(--success))"
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: "hsl(var(--success))" }}
                                        activeDot={{ r: 6, fill: "hsl(var(--success))" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pie: Distribución de status */}
                    <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="px-5 py-3 border-b border-border">
                            <p className="text-sm font-semibold">Distribución de estados</p>
                            <p className="text-xs text-muted-foreground">
                                {filtered.length} registros totales en {statusDistribution.length} estados
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {statusDistribution.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                        backgroundColor: "hsl(var(--popover))",
                                        color: "hsl(var(--popover-foreground))",
                                        border: "1px solid hsl(var(--border))",
                                    }} />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11 }}
                                        formatter={(value: string) => <span className="text-foreground">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Heatmap: Retardos por empleado × día */}
                    <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="px-5 py-3 border-b border-border">
                            <p className="text-sm font-semibold">Mapa de calor — retardos por empleado</p>
                            <p className="text-xs text-muted-foreground">
                                {heatmapData.rows.length} empleados × {heatmapData.dates.length} días
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            {heatmapData.rows.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Sin retardos.</p>
                            ) : (
                                <div className="overflow-auto max-h-[280px]">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 z-10 bg-card">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground sticky left-0 bg-card">Empleado</th>
                                                {heatmapData.dates.map((d) => (
                                                    <th key={d} className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
                                                        {d.slice(5)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {heatmapData.rows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="px-2 py-1 font-medium whitespace-nowrap sticky left-0 bg-card">{row.nombre}</td>
                                                    {heatmapData.dates.map((d) => {
                                                        const val = (row as Record<string, unknown>)[d] as number
                                                        const intensity = Math.min(val / 60, 1) * 0.7 + 0.15
                                                        return (
                                                            <td
                                                                key={d}
                                                                className={cn(
                                                                    "px-2 py-1 text-center rounded",
                                                                    val > 30 ? "text-warning-foreground font-medium" : val > 0 ? "text-warning" : "",
                                                                )}
                                                                style={{
                                                                    backgroundColor: val > 0
                                                                        ? `hsl(var(--warning) / ${intensity})`
                                                                        : "transparent",
                                                                }}
                                                            >
                                                                {val > 0 ? `${val}m` : ""}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function KpiCard({ icon: Icon, label, value, tone }: {
    icon: typeof UserCheck
    label: string
    value: string
    tone: string
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-xl font-semibold", tone)}>{value}</p>
        </div>
    )
}
