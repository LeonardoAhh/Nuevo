"use client"

import { useMemo } from "react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LineChart, Line,
} from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { PunchAnalysis } from "./retardos-types"
import { PUNCH_STATUS_LABELS } from "./retardos-constants"

const STATUS_CHART_COLORS: Record<string, string> = {
    on_time: "#10b981",
    late: "#f59e0b",
    missing_punch: "#ef4444",
    no_schedule: "#9ca3af",
    day_off: "#6b7280",
    incidence: "#3b82f6",
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface Props {
    analyses: PunchAnalysis[]
}

export default function RetardosCharts({ analyses }: Props) {
    const working = useMemo(
        () => analyses.filter((a) => a.status !== "day_off" && a.status !== "incidence"),
        [analyses],
    )

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
        for (const a of analyses) {
            map.set(a.status, (map.get(a.status) ?? 0) + 1)
        }
        return Array.from(map.entries()).map(([status, count]) => ({
            name: PUNCH_STATUS_LABELS[status] || status,
            value: count,
            color: STATUS_CHART_COLORS[status] || "#9ca3af",
        }))
    }, [analyses])

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

    if (working.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No hay datos para graficar.
            </p>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar: Retardos por turno */}
            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                <CardHeader className="px-5 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Retardos por turno</p>
                </CardHeader>
                <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={retardosByTurno}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="turno" tick={{ fontSize: 12 }} label={{ value: "Turno", position: "insideBottom", offset: -5, fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                formatter={(value: number, name: string) => [value, name === "retardos" ? "Retardos" : "Total"]}
                            />
                            <Bar dataKey="retardos" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Retardos" />
                            <Bar dataKey="total" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Total registros" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Line: Puntualidad por día */}
            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                <CardHeader className="px-5 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Puntualidad por día de semana</p>
                </CardHeader>
                <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={puntualidadByDay}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                            <Tooltip
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                formatter={(value: number) => [`${value}%`, "Puntualidad"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="puntualidad"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Pie: Distribución de status */}
            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                <CardHeader className="px-5 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Distribución de estados</p>
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
                                    <Cell key={idx} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
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
                </CardHeader>
                <CardContent className="p-4">
                    {heatmapData.rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Sin retardos.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
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
                                                return (
                                                    <td
                                                        key={d}
                                                        className="px-2 py-1 text-center"
                                                        style={{
                                                            backgroundColor: val > 0
                                                                ? `rgba(245, 158, 11, ${Math.min(val / 60, 1) * 0.7 + 0.1})`
                                                                : "transparent",
                                                            color: val > 30 ? "white" : undefined,
                                                            borderRadius: 4,
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
    )
}
