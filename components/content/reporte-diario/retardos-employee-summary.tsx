"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    UserCheck,
    AlertTriangle,
    Clock,
    Zap,
    UtensilsCrossed,
    ChevronDown,
    ChevronUp,
    Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import type { EmployeeSummary, PunchAnalysis } from "./retardos-types"
import { PUNCH_STATUS_LABELS, PUNCH_STATUS_COLORS } from "./retardos-constants"
import { INCIDENCIA_LABELS } from "./constants"
import { minutesToHHMM } from "./retardos-helpers"

interface Props {
    summaries: EmployeeSummary[]
}

function EmployeeCard({ emp }: { emp: EmployeeSummary }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{emp.numero_empleado}</span>
                        <span className="text-sm font-medium truncate">{emp.nombre}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">T{emp.turno}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{emp.total_dias} días</span>
                        <span className={emp.pct_puntualidad >= 90 ? "text-emerald-600" : "text-amber-600"}>
                            {emp.pct_puntualidad}% puntual
                        </span>
                        {emp.dias_retardo > 0 && (
                            <span className="text-amber-600">{emp.dias_retardo} retardos</span>
                        )}
                        {emp.total_minutos_extra > 0 && (
                            <span className="text-blue-500">{minutesToHHMM(emp.total_minutos_extra)} extra</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-semibold">{minutesToHHMM(emp.total_minutos_trabajados)}</p>
                        <p className="text-[10px] text-muted-foreground">hrs trabajadas</p>
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-border">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20">
                        <MiniKPI icon={UserCheck} label="Puntualidad" value={`${emp.pct_puntualidad}%`} color={emp.pct_puntualidad >= 90 ? "text-emerald-600" : "text-amber-600"} />
                        <MiniKPI icon={AlertTriangle} label="Retardos" value={`${emp.total_minutos_retardo} min`} color={emp.total_minutos_retardo > 0 ? "text-amber-600" : "text-emerald-600"} />
                        <MiniKPI icon={Zap} label="T. extra" value={minutesToHHMM(emp.total_minutos_extra)} color={emp.total_minutos_extra > 0 ? "text-blue-500" : "text-muted-foreground"} />
                        <MiniKPI icon={UtensilsCrossed} label="Prom. comida" value={`${emp.promedio_comida_minutos} min`} color="text-muted-foreground" />
                    </div>

                    {/* Detail table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Entrada</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sal. com</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ent. com</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Salida</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Hrs</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Retardo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emp.registros.sort((a, b) => a.fecha.localeCompare(b.fecha)).map((a, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="px-3 py-1.5 font-mono text-xs">{a.fecha}</td>
                                        <td className={cn("px-3 py-1.5 text-xs font-medium", PUNCH_STATUS_COLORS[a.status])}>
                                            {a.status === "incidence" ? (INCIDENCIA_LABELS[a.incidencia] || a.incidencia) : PUNCH_STATUS_LABELS[a.status]}
                                        </td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{a.entrada1 || "—"}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{a.salida1 || "—"}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{a.entrada2 || "—"}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{a.salida2 || "—"}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs font-medium">{minutesToHHMM(a.minutos_trabajados)}</td>
                                        <td className={cn("px-3 py-1.5 text-xs", a.minutos_retardo > 0 ? "text-amber-600 font-medium" : "")}>
                                            {a.minutos_retardo > 0 ? `${a.minutos_retardo} min` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function MiniKPI({ icon: Icon, label, value, color }: {
    icon: typeof Clock
    label: string
    value: string
    color: string
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn("text-sm font-semibold", color)}>{value}</p>
            </div>
        </div>
    )
}

export default function RetardosEmployeeSummary({ summaries }: Props) {
    const [search, setSearch] = useState("")

    const filtered = search
        ? summaries.filter((e) =>
            e.numero_empleado.toLowerCase().includes(search.toLowerCase()) ||
            e.nombre.toLowerCase().includes(search.toLowerCase()),
        )
        : summaries

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar empleado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                />
            </div>
            <div className="space-y-2">
                {filtered.map((emp) => (
                    <EmployeeCard key={emp.numero_empleado} emp={emp} />
                ))}
                {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Sin resultados.
                    </p>
                )}
            </div>
        </div>
    )
}
