"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    CloudUpload,
    Loader2,
    AlertCircle,
    X,
    Clock,
    Timer,
    UserCheck,
    AlertTriangle,
    Zap,
    UtensilsCrossed,
    ChevronDown,
    ChevronUp,
    Download,
    Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"

import type { ScheduleDefinition, PunchRow, PunchAnalysis } from "./retardos-types"
import { DEFAULT_SCHEDULES, PUNCH_STATUS_LABELS, PUNCH_STATUS_COLORS } from "./retardos-constants"
import { INCIDENCIA_LABELS } from "./constants"
import {
    parseExcelPunches,
    analyzeAllRows,
    computeRetardosSummary,
    minutesToHHMM,
    exportRetardosExcel,
    mergeNightShiftPunches,
    classifyPunchesBySchedule,
} from "./retardos-helpers"
import RetardosScheduleConfig from "./retardos-schedule-config"

type SortField = "numero_empleado" | "nombre" | "fecha" | "turno" | "status" | "minutos_retardo" | "minutos_trabajados" | "minutos_comida" | "minutos_extra"
type SortDir = "asc" | "desc"

export default function RetardosSection() {
    const [schedules, setSchedules] = useState<ScheduleDefinition[]>(DEFAULT_SCHEDULES)
    const [punchRows, setPunchRows] = useState<PunchRow[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const [filterStatus, setFilterStatus] = useState("")
    const [filterTurno, setFilterTurno] = useState("")
    const [sortField, setSortField] = useState<SortField>("numero_empleado")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const [searchQuery, setSearchQuery] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const analyses = useMemo(() => {
        const merged = mergeNightShiftPunches(punchRows, schedules)
        const classified = classifyPunchesBySchedule(merged, schedules)
        return analyzeAllRows(classified, schedules)
    }, [punchRows, schedules])

    const summary = useMemo(
        () => computeRetardosSummary(analyses),
        [analyses],
    )

    const filteredAnalyses = useMemo(() => {
        let result = analyses
        if (filterStatus === "exceso_comida") {
            result = result.filter((a) => a.exceso_comida > 0)
        } else if (filterStatus === "tiempo_extra") {
            result = result.filter((a) => a.minutos_extra > 0)
        } else if (filterStatus) {
            result = result.filter((a) => a.status === filterStatus)
        }
        if (filterTurno) result = result.filter((a) => String(a.turno) === filterTurno)
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter((a) =>
                a.numero_empleado.toLowerCase().includes(q) ||
                a.nombre.toLowerCase().includes(q),
            )
        }
        return result.slice().sort((a, b) => {
            const av = a[sortField]
            const bv = b[sortField]
            const cmp = typeof av === "number" && typeof bv === "number"
                ? av - bv
                : String(av).localeCompare(String(bv))
            return sortDir === "asc" ? cmp : -cmp
        })
    }, [analyses, filterStatus, filterTurno, searchQuery, sortField, sortDir])

    const availableTurnos = useMemo(
        () => Array.from(new Set(punchRows.map((r) => r.turno))).sort((a, b) => a - b),
        [punchRows],
    )

    const handleFile = useCallback(async (file: File) => {
        setLoading(true)
        setErrors([])
        try {
            const { rows, errors: parseErrors } = await parseExcelPunches(file)
            setPunchRows(rows)
            setErrors(parseErrors)
            setFileName(file.name)
        } catch (err) {
            setErrors([`Error al leer archivo: ${err instanceof Error ? err.message : String(err)}`])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => setIsDragging(false), [])

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDir("asc")
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDir === "asc"
            ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
            : <ChevronDown className="w-3 h-3 inline ml-0.5" />
    }

    const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5"

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* ── Schedule Config ──────────────────────────────────── */}
                <RetardosScheduleConfig schedules={schedules} onChange={setSchedules} />

                {/* ── File Upload ──────────────────────────────────────── */}
                <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">Retardos y marcajes</p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-3 py-4 sm:px-5 sm:py-5 space-y-4">
                        <label
                            className={cn(
                                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-10 py-6 text-sm text-muted-foreground transition active:scale-95",
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-muted/40 hover:border-primary hover:bg-background",
                            )}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {loading ? (
                                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                            ) : (
                                <CloudUpload className="w-7 h-7 text-muted-foreground/60" />
                            )}
                            <span>{loading ? "Procesando..." : fileName || "Cargar archivo de checadas (.xlsx)"}</span>
                            <span className="text-xs text-muted-foreground/60">
                                {isDragging ? "Suelta el archivo aquí" : "Columnas: Núm. Emp., Nombre del Empleado, Fecha, Horario, Tipo, Entrada/Salida (×5 pares)"}
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {/* ── Errors ───────────────────────────────────── */}
                        {errors.length > 0 && (
                            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                        <h3 className="text-sm font-semibold text-destructive">Errores</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setErrors([])}
                                        className="rounded-md p-1 text-destructive/60 transition hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <ul className="space-y-1">
                                    {errors.slice(0, 10).map((err, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-destructive/90">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/60" />
                                            {err}
                                        </li>
                                    ))}
                                    {errors.length > 10 && (
                                        <li className="text-sm text-destructive/70">...y {errors.length - 10} más</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* ── KPI Dashboard ────────────────────────────────────── */}
            {punchRows.length > 0 && (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: "Empleados", value: summary.total_empleados, icon: UserCheck, color: "text-foreground" },
                        { label: "Retardos", value: summary.total_retardos, icon: AlertTriangle, color: summary.total_retardos > 0 ? "text-amber-600" : "text-emerald-600" },
                        { label: "Marcajes faltantes", value: summary.total_faltas_marcaje, icon: AlertCircle, color: summary.total_faltas_marcaje > 0 ? "text-destructive" : "text-emerald-600" },
                        { label: "Puntualidad", value: `${summary.pct_puntualidad}%`, icon: Timer, color: summary.pct_puntualidad >= 90 ? "text-emerald-600" : "text-amber-600" },
                        { label: "Hrs. trabajadas", value: minutesToHHMM(summary.total_minutos_trabajados), icon: Clock, color: "text-foreground" },
                        { label: "Tiempo extra", value: minutesToHHMM(summary.total_minutos_extra), icon: Zap, color: summary.total_minutos_extra > 0 ? "text-blue-500" : "text-foreground" },
                        { label: "Prom. comida", value: `${summary.promedio_comida_minutos} min`, icon: UtensilsCrossed, color: "text-foreground" },
                        { label: "Registros", value: summary.total_registros, icon: Clock, color: "text-foreground" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                            </div>
                            <p className={cn("text-xl font-semibold", color)}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Search + Filters ──────────────────────────────────── */}
            {punchRows.length > 0 && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por número o nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
            )}
            {punchRows.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => exportRetardosExcel(filteredAnalyses)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition bg-card border-border text-muted-foreground hover:border-primary hover:text-primary flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Excel
                    </button>
                    <span className="text-xs text-muted-foreground self-center mx-1">|</span>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                            !filterStatus ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-foreground/40",
                        )}
                    >
                        Todos ({analyses.length})
                    </button>
                    {(["on_time", "late", "missing_punch", "no_schedule", "incidence", "day_off"] as const).map((st) => {
                        const count = analyses.filter((a) => a.status === st).length
                        if (count === 0) return null
                        return (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setFilterStatus(filterStatus === st ? "" : st)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                                    filterStatus === st ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-foreground/40",
                                )}
                            >
                                {PUNCH_STATUS_LABELS[st]} ({count})
                            </button>
                        )
                    })}
                    {(() => {
                        const count = analyses.filter((a) => a.minutos_extra > 0).length
                        if (count === 0) return null
                        return (
                            <button
                                type="button"
                                onClick={() => setFilterStatus(filterStatus === "tiempo_extra" ? "" : "tiempo_extra")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                                    filterStatus === "tiempo_extra" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-foreground/40",
                                )}
                            >
                                T. extra ({count})
                            </button>
                        )
                    })()}
                    {(() => {
                        const count = analyses.filter((a) => a.exceso_comida > 0).length
                        if (count === 0) return null
                        return (
                            <button
                                type="button"
                                onClick={() => setFilterStatus(filterStatus === "exceso_comida" ? "" : "exceso_comida")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                                    filterStatus === "exceso_comida" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-foreground/40",
                                )}
                            >
                                Exc. comida ({count})
                            </button>
                        )
                    })()}

                    {availableTurnos.length > 1 && (
                        <>
                            <span className="text-xs text-muted-foreground self-center mx-1">|</span>
                            {availableTurnos.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFilterTurno(filterTurno === String(t) ? "" : String(t))}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                                        filterTurno === String(t) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-foreground/40",
                                    )}
                                >
                                    Turno {t}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* ── Data Table ──────────────────────────────────────── */}
            {punchRows.length > 0 && (
                <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        {([
                                            ["numero_empleado", "No."],
                                            ["nombre", "Nombre"],
                                            ["fecha", "Fecha"],
                                            ["turno", "Turno"],
                                            ["status", "Estado"],
                                            ["entrada1", "Entrada"],
                                            ["salida1", "Sal. comedor"],
                                            ["entrada2", "Ent. comedor"],
                                            ["salida2", "Salida"],
                                            ["minutos_trabajados", "Hrs. trab."],
                                            ["minutos_comida", "Comida"],
                                            ["exceso_comida", "Exc. comida"],
                                            ["minutos_retardo", "Retardo"],
                                            ["minutos_extra", "T. extra"],
                                        ] as [string, string][]).map(([field, label]) => (
                                            <th
                                                key={field}
                                                onClick={() => {
                                                    if (["numero_empleado", "nombre", "fecha", "turno", "status", "minutos_trabajados", "minutos_comida", "minutos_retardo", "minutos_extra"].includes(field)) {
                                                        toggleSort(field as SortField)
                                                    }
                                                }}
                                                className={cn(
                                                    "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                                                    ["numero_empleado", "nombre", "fecha", "turno", "status", "minutos_trabajados", "minutos_comida", "minutos_retardo", "minutos_extra"].includes(field) && "cursor-pointer hover:text-foreground",
                                                )}
                                            >
                                                {label}
                                                {["numero_empleado", "nombre", "fecha", "turno", "status", "minutos_trabajados", "minutos_comida", "minutos_retardo", "minutos_extra"].includes(field) && (
                                                    <SortIcon field={field as SortField} />
                                                )}
                                            </th>
                                        ))}

                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAnalyses.map((a, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 font-mono text-xs">{a.numero_empleado}</td>
                                            <td className="px-3 py-2 max-w-[200px] truncate">{a.nombre}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.fecha || "—"}</td>
                                            <td className="px-3 py-2 text-center">{a.turno}</td>
                                            <td className={cn("px-3 py-2 text-xs font-medium whitespace-nowrap", PUNCH_STATUS_COLORS[a.status])}>
                                                {a.status === "incidence" ? (INCIDENCIA_LABELS[a.incidencia] || a.incidencia) : PUNCH_STATUS_LABELS[a.status]}
                                                {a.marcajes_faltantes.length > 0 && (
                                                    <span className="block text-[10px] text-destructive/70">
                                                        {a.marcajes_faltantes.join(", ")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.entrada1 || "—"}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.salida1 || "—"}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.entrada2 || "—"}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.salida2 || "—"}</td>
                                            <td className="px-3 py-2 font-mono text-xs font-medium">{minutesToHHMM(a.minutos_trabajados)}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{a.minutos_comida > 0 ? `${a.minutos_comida} min` : "—"}</td>
                                            <td className={cn("px-3 py-2 text-xs font-medium", a.exceso_comida > 0 ? "text-amber-600" : "text-muted-foreground")}>
                                                {a.exceso_comida > 0 ? `${a.exceso_comida} min` : "—"}
                                            </td>
                                            <td className={cn("px-3 py-2 font-mono text-xs", a.minutos_retardo > 0 ? "text-amber-600 font-medium" : "")}>
                                                {a.minutos_retardo > 0 ? `${a.minutos_retardo} min` : "—"}
                                            </td>
                                            <td className={cn("px-3 py-2 font-mono text-xs", a.minutos_extra > 0 ? "text-blue-500 font-medium" : "")}>
                                                {a.minutos_extra > 0 ? minutesToHHMM(a.minutos_extra) : "—"}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredAnalyses.length === 0 && punchRows.length > 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Sin resultados con los filtros actuales.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
