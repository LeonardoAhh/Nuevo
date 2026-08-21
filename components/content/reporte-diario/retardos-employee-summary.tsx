"use client"

import { useMemo, useState } from "react"
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
    Filter,
    ArrowUpDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { EmployeeSummary, PunchAnalysis } from "./retardos-types"
import { PUNCH_STATUS_LABELS, PUNCH_STATUS_COLORS } from "./retardos-constants"
import { INCIDENCIA_LABELS } from "./constants"
import { minutesToHHMM } from "./retardos-helpers"

function getInitials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getPuntualidadTone(pct: number): { text: string; bg: string } {
    if (pct >= 90) return { text: "text-success", bg: "bg-success/15" }
    if (pct >= 70) return { text: "text-warning", bg: "bg-warning/15" }
    return { text: "text-destructive", bg: "bg-destructive/15" }
}

type EmpSortField = "nombre" | "puntualidad" | "retardos" | "horas" | "extra"

const SORT_LABELS: Record<EmpSortField, string> = {
    nombre: "Nombre (A–Z)",
    puntualidad: "Puntualidad ↓",
    retardos: "Retardos ↓",
    horas: "Horas trabajadas ↓",
    extra: "Tiempo extra ↓",
}

interface Props {
    summaries: EmployeeSummary[]
}

function EmployeeCard({ emp }: { emp: EmployeeSummary }) {
    const [open, setOpen] = useState(false)
    const tone = getPuntualidadTone(emp.pct_puntualidad)

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
            >
                <Avatar className={cn("h-10 w-10 shrink-0", tone.bg)}>
                    <AvatarFallback className={cn("text-xs font-semibold bg-transparent", tone.text)}>
                        {getInitials(emp.nombre)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{emp.numero_empleado}</span>
                        <span className="text-sm font-medium truncate">{emp.nombre}</span>
                        <Badge variant="secondary" size="sm">T{emp.turno}</Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{emp.total_dias} días</span>
                        <span className={tone.text}>{emp.pct_puntualidad}% puntual</span>
                        {emp.dias_retardo > 0 && (
                            <span className="text-warning">{emp.dias_retardo} retardos</span>
                        )}
                        {emp.total_minutos_extra > 0 && (
                            <span className="text-info">{minutesToHHMM(emp.total_minutos_extra)} extra</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <p className="text-sm font-semibold">{minutesToHHMM(emp.total_minutos_trabajados)}</p>
                        <p className="text-[10px] text-muted-foreground">hrs trabajadas</p>
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-border">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20">
                        <MiniKPI icon={UserCheck} label="Puntualidad" value={`${emp.pct_puntualidad}%`} color={tone.text} />
                        <MiniKPI icon={AlertTriangle} label="Retardos" value={`${emp.total_minutos_retardo} min`} color={emp.total_minutos_retardo > 0 ? "text-warning" : "text-success"} />
                        <MiniKPI icon={Zap} label="T. extra" value={minutesToHHMM(emp.total_minutos_extra)} color={emp.total_minutos_extra > 0 ? "text-info" : "text-muted-foreground"} />
                        <MiniKPI icon={UtensilsCrossed} label="Prom. comida" value={`${emp.promedio_comida_minutos} min`} color="text-muted-foreground" />
                    </div>

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
                                        <td className={cn("px-3 py-1.5 text-xs", a.minutos_retardo > 0 ? "text-warning font-medium" : "")}>
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
    const [sortField, setSortField] = useState<EmpSortField>("nombre")
    const [onlyWithRetardos, setOnlyWithRetardos] = useState(false)

    const filtered = useMemo(() => {
        let result = summaries
        if (search) {
            const q = search.toLowerCase()
            result = result.filter((e) =>
                e.numero_empleado.toLowerCase().includes(q) ||
                e.nombre.toLowerCase().includes(q),
            )
        }
        if (onlyWithRetardos) {
            result = result.filter((e) => e.dias_retardo > 0)
        }
        const sorted = [...result]
        sorted.sort((a, b) => {
            switch (sortField) {
                case "puntualidad": return b.pct_puntualidad - a.pct_puntualidad
                case "retardos": return b.total_minutos_retardo - a.total_minutos_retardo
                case "horas": return b.total_minutos_trabajados - a.total_minutos_trabajados
                case "extra": return b.total_minutos_extra - a.total_minutos_extra
                case "nombre":
                default: return a.nombre.localeCompare(b.nombre)
            }
        })
        return sorted
    }, [summaries, search, sortField, onlyWithRetardos])

    return (
        <div className="space-y-4">
            {/* Toolbar: Search + Sort + Filter chip */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar empleado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
                <Select value={sortField} onValueChange={(v) => setSortField(v as EmpSortField)}>
                    <SelectTrigger className="h-9 w-full text-sm sm:w-52">
                        <ArrowUpDown className="w-4 h-4 mr-1 text-muted-foreground" />
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(SORT_LABELS) as EmpSortField[]).map((k) => (
                            <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant={onlyWithRetardos ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOnlyWithRetardos(!onlyWithRetardos)}
                    className="h-9"
                >
                    <Filter className="w-4 h-4" />
                    Con retardos
                </Button>
            </div>

            {/* Contador */}
            <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{filtered.length}</span> de {summaries.length} empleados
            </p>

            {/* Lista */}
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
