"use client"

import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
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
    Trash2,
    BarChart3,
    Users,
    Table,
    Plus,
    MoreVertical,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { ScheduleDefinition, PunchRow } from "./retardos-types"
import { DEFAULT_SCHEDULES, PUNCH_STATUS_LABELS, PUNCH_STATUS_COLORS, PUNCH_STATUS_BADGE_VARIANTS } from "./retardos-constants"
import { INCIDENCIA_LABELS } from "./constants"
import {
    parseExcelPunches,
    analyzeAllRows,
    computeRetardosSummary,
    computeEmployeeSummaries,
    minutesToHHMM,
    exportRetardosExcel,
    mergeNightShiftPunches,
    classifyPunchesBySchedule,
} from "./retardos-helpers"
// Schedule config removed — kept internally for analysis
// import RetardosScheduleConfig from "./retardos-schedule-config"

const RetardosCharts = lazy(() => import("./retardos-charts"))
const RetardosEmployeeSummary = lazy(() => import("./retardos-employee-summary"))

type SortField = "numero_empleado" | "nombre" | "fecha" | "turno" | "status" | "minutos_retardo" | "minutos_trabajados" | "minutos_comida" | "minutos_extra"
type SortDir = "asc" | "desc"

const SORTABLE_FIELDS = new Set<SortField>([
    "numero_empleado", "nombre", "fecha", "turno", "status",
    "minutos_trabajados", "minutos_comida", "minutos_retardo", "minutos_extra",
])

function SortIcon({ field, activeField, activeDir }: {
    field: SortField
    activeField: SortField
    activeDir: SortDir
}) {
    if (activeField !== field) return null
    return activeDir === "asc"
        ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
        : <ChevronDown className="w-3 h-3 inline ml-0.5" />
}

type ViewTab = "table" | "employees" | "charts"

export default function RetardosSection() {
    const [schedules, setSchedules] = useState<ScheduleDefinition[]>(DEFAULT_SCHEDULES)
    const [punchRows, setPunchRows] = useState<PunchRow[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [fileNames, setFileNames] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [filterStatus, setFilterStatus] = useState("")
    const [filterTurno, setFilterTurno] = useState("")
    const [sortField, setSortField] = useState<SortField>("numero_empleado")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<ViewTab>("table")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<25 | 50 | 100>(50)
    const [density, setDensity] = useState<"compact" | "cozy">("cozy")
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

    const employeeSummaries = useMemo(
        () => computeEmployeeSummaries(analyses),
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
                a.nombre.toLowerCase().includes(q) ||
                a.departamento.toLowerCase().includes(q) ||
                a.area.toLowerCase().includes(q),
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

    useEffect(() => {
        setCurrentPage(1)
    }, [filterStatus, filterTurno, searchQuery, pageSize])

    const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / pageSize))

    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredAnalyses.slice(start, start + pageSize)
    }, [filteredAnalyses, currentPage, pageSize])

    const availableTurnos = useMemo(
        () => Array.from(new Set(punchRows.map((r) => r.turno))).sort((a, b) => a - b),
        [punchRows],
    )

    const statusOptions = useMemo(() => {
        const opts: Array<{ value: string; label: string; count: number }> = [
            { value: "all", label: "Todos", count: analyses.length },
        ]
            ; (["on_time", "late", "missing_punch", "no_schedule", "incidence", "day_off"] as const).forEach((st) => {
                const count = analyses.filter((a) => a.status === st).length
                if (count > 0) opts.push({ value: st, label: PUNCH_STATUS_LABELS[st], count })
            })
        const teCount = analyses.filter((a) => a.minutos_extra > 0).length
        if (teCount > 0) opts.push({ value: "tiempo_extra", label: "T. extra", count: teCount })
        const ecCount = analyses.filter((a) => a.exceso_comida > 0).length
        if (ecCount > 0) opts.push({ value: "exceso_comida", label: "Exc. comida", count: ecCount })
        return opts
    }, [analyses])

    const handleFiles = useCallback(async (files: File[]) => {
        setLoading(true)
        const allNewRows: PunchRow[] = []
        const allErrors: string[] = []
        const names: string[] = []
        for (const file of files) {
            try {
                const { rows, errors: parseErrors } = await parseExcelPunches(file)
                allNewRows.push(...rows)
                allErrors.push(...parseErrors)
                names.push(file.name)
            } catch (err) {
                allErrors.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`)
            }
        }
        setPunchRows((prev) => [...prev, ...allNewRows])
        setErrors((prev) => [...prev, ...allErrors])
        setFileNames((prev) => [...prev, ...names])
        setLoading(false)
    }, [])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) handleFiles(Array.from(files))
        if (fileInputRef.current) fileInputRef.current.value = ""
    }, [handleFiles])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) handleFiles(files)
    }, [handleFiles])

    const handleReset = useCallback(() => {
        setPunchRows([])
        setErrors([])
        setFileNames([])
        setFilterStatus("")
        setFilterTurno("")
        setSearchQuery("")
        setActiveTab("table")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }, [])

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



    return (
        <div className="flex flex-col gap-5">
            {/* ── Upload + KPIs ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── File Upload (1/3) ────────────────────────────────── */}
                <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">Seleccione archivo</p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-3 py-4 sm:px-5 sm:py-5 space-y-4">
                        <label
                            className={cn(
                                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-6 text-sm text-muted-foreground transition active:scale-95",
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
                            <span className="text-center">{loading ? "Procesando..." : fileNames.length > 0 ? `${fileNames.length} archivo(s)` : "Cargar reporte (.xlsx)"}</span>
                            <span className="text-xs text-muted-foreground/60 text-center">
                                {isDragging ? "Suelta aquí" : "Múltiples archivos"}
                            </span>
                            {fileNames.length > 0 && (
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Agregar más
                                </span>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {/* ── Errors ───────────────────────────────────── */}
                        {errors.length > 0 && (
                            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                        <h3 className="text-xs font-semibold text-destructive">Errores</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setErrors([])}
                                        className="rounded-md p-1 text-destructive/60 transition hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <ul className="space-y-1">
                                    {errors.slice(0, 5).map((err, i) => (
                                        <li key={i} className="text-xs text-destructive/90 truncate">{err}</li>
                                    ))}
                                    {errors.length > 5 && (
                                        <li className="text-xs text-destructive/70">...y {errors.length - 5} más</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── KPIs (2/3) ───────────────────────────────────────── */}
                {punchRows.length > 0 && (
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Retardos", value: summary.total_retardos, color: summary.total_retardos > 0 ? "text-amber-600" : "text-emerald-600" },
                            { label: "Marcajes faltantes", value: summary.total_faltas_marcaje, color: summary.total_faltas_marcaje > 0 ? "text-destructive" : "text-emerald-600" },
                            { label: "Puntualidad", value: `${summary.pct_puntualidad}%`, color: summary.pct_puntualidad >= 90 ? "text-emerald-600" : "text-amber-600" },
                            { label: "Hrs. trabajadas", value: minutesToHHMM(summary.total_minutos_trabajados), color: "text-foreground" },
                            { label: "Tiempo extra", value: minutesToHHMM(summary.total_minutos_extra), color: summary.total_minutos_extra > 0 ? "text-blue-500" : "text-foreground" },
                            { label: "Prom. comida", value: `${summary.promedio_comida_minutos} min`, color: "text-foreground" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                                </div>
                                <p className={cn("text-xl font-semibold", color)}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── View Tabs + Acciones (kebab) ─────────────────────────────── */}
            {punchRows.length > 0 && (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
                        {([
                            { key: "table" as ViewTab, label: "Tabla", icon: Table },
                            { key: "employees" as ViewTab, label: "Empleados", icon: Users },
                            { key: "charts" as ViewTab, label: "Gráficas", icon: BarChart3 },
                        ]).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
                                    activeTab === key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Acciones"
                                className="h-9 w-9"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                            {fileNames.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground truncate">
                                        {fileNames.join(", ")}
                                    </div>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onSelect={() => exportRetardosExcel(filteredAnalyses)}>
                                <Download className="w-4 h-4" />
                                Descargar Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={handleReset}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                                Limpiar datos
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* ── Toolbar: Search + Turno Select ───────────────────────────── */}
            {punchRows.length > 0 && activeTab === "table" && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número, nombre, depto o área..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    {availableTurnos.length > 1 && (
                        <Select
                            value={filterTurno || "all"}
                            onValueChange={(v) => setFilterTurno(v === "all" ? "" : v)}
                        >
                            <SelectTrigger className="h-9 w-full text-sm sm:w-44">
                                <SelectValue placeholder="Turno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los turnos</SelectItem>
                                {availableTurnos.map((t) => (
                                    <SelectItem key={t} value={String(t)}>
                                        Turno {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {/* ── Segmented Control: Estado ───────────────────────────────── */}
            {punchRows.length > 0 && activeTab === "table" && (
                <Tabs
                    value={filterStatus || "all"}
                    onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}
                    className="w-full"
                >
                    <TabsList className="flex h-auto flex-wrap justify-start gap-1 rounded-lg border border-border bg-muted/40 p-1">
                        {statusOptions.map(({ value, label, count }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="group h-8 gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                            >
                                {label}
                                <Badge
                                    variant="secondary"
                                    size="sm"
                                    className="bg-muted text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary"
                                >
                                    {count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}

            {/* ── Employee Summary View ─────────────────────────────── */}
            {punchRows.length > 0 && activeTab === "employees" && (
                <Suspense fallback={<div className="text-sm text-muted-foreground text-center py-8">Cargando...</div>}>
                    <RetardosEmployeeSummary summaries={employeeSummaries} />
                </Suspense>
            )}

            {/* ── Charts View ──────────────────────────────────────── */}
            {punchRows.length > 0 && activeTab === "charts" && (
                <Suspense fallback={<div className="text-sm text-muted-foreground text-center py-8">Cargando gráficas...</div>}>
                    <RetardosCharts analyses={analyses} />
                </Suspense>
            )}

            {/* ── Data Table ──────────────────────────────────────── */}
            {punchRows.length > 0 && activeTab === "table" && (
                <div className="space-y-3">
                    {/* Density + Page size toolbar */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            Mostrando <span className="font-medium text-foreground">{pageRows.length}</span> de {filteredAnalyses.length} registros
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
                                {(["compact", "cozy"] as const).map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDensity(d)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-[11px] font-medium transition",
                                            density === d
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                        aria-pressed={density === d}
                                    >
                                        {d === "compact" ? "Compacto" : "Cómodo"}
                                    </button>
                                ))}
                            </div>
                            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) as 25 | 50 | 100)}>
                                <SelectTrigger className="h-9 w-24 text-sm" aria-label="Filas por página">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25 / pág</SelectItem>
                                    <SelectItem value="50">50 / pág</SelectItem>
                                    <SelectItem value="100">100 / pág</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardContent className="p-0">
                            <TooltipProvider delayDuration={200}>
                                <div className="overflow-auto max-h-[640px] relative">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 z-20 bg-card">
                                            <tr className="border-b border-border bg-muted/60 backdrop-blur">
                                                {([
                                                    ["numero_empleado", "No.", true],
                                                    ["nombre", "Nombre", true],
                                                    ["departamento", "Depto.", false],
                                                    ["area", "Área", false],
                                                    ["fecha", "Fecha", false],
                                                    ["turno", "Turno", false],
                                                    ["status", "Estado", false],
                                                    ["entrada1", "Entrada", false],
                                                    ["salida1", "Sal. comedor", false],
                                                    ["entrada2", "Ent. comedor", false],
                                                    ["salida2", "Salida", false],
                                                    ["minutos_trabajados", "Hrs. trab.", false],
                                                    ["minutos_comida", "Comida", false],
                                                    ["exceso_comida", "Exc. comida", false],
                                                    ["minutos_retardo", "Retardo", false],
                                                    ["minutos_extra", "T. extra", false],
                                                ] as [string, string, boolean][]).map(([field, label, isSticky], idx) => (
                                                    <th
                                                        key={field}
                                                        onClick={() => {
                                                            if (SORTABLE_FIELDS.has(field as SortField)) {
                                                                toggleSort(field as SortField)
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap bg-muted/60",
                                                            SORTABLE_FIELDS.has(field as SortField) && "cursor-pointer hover:text-foreground",
                                                            isSticky && "sticky bg-muted/95 backdrop-blur",
                                                            idx === 0 && "left-0 z-10",
                                                            idx === 1 && "left-[64px] z-10 border-r border-border",
                                                        )}
                                                    >
                                                        {label}
                                                        {SORTABLE_FIELDS.has(field as SortField) && (
                                                            <SortIcon field={field as SortField} activeField={sortField} activeDir={sortDir} />
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageRows.map((a, i) => {
                                                const cellY = density === "compact" ? "py-1" : "py-2"
                                                return (
                                                    <tr
                                                        key={`${a.numero_empleado}-${a.fecha}-${i}`}
                                                        className="border-b border-border/50 hover:bg-muted/40 odd:bg-muted/10 transition-colors"
                                                    >
                                                        <td className={cn("px-3 font-mono text-xs sticky left-0 bg-card", cellY)}>
                                                            {a.numero_empleado}
                                                        </td>
                                                        <td className={cn("px-3 max-w-[200px] truncate sticky left-[64px] bg-card border-r border-border", cellY)}>
                                                            {a.nombre}
                                                        </td>
                                                        <td className={cn("px-3 text-xs text-muted-foreground max-w-[160px] truncate", cellY)} title={a.departamento}>
                                                            {a.departamento || "—"}
                                                        </td>
                                                        <td className={cn("px-3 text-xs text-muted-foreground max-w-[200px] truncate", cellY)} title={a.area}>
                                                            {a.area || "—"}
                                                        </td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.fecha || "—"}</td>
                                                        <td className={cn("px-3 text-center", cellY)}>{a.turno}</td>
                                                        <td className={cn("px-3 whitespace-nowrap", cellY)}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge
                                                                    variant={PUNCH_STATUS_BADGE_VARIANTS[a.status] || "secondary"}
                                                                    size="sm"
                                                                >
                                                                    {a.status === "incidence"
                                                                        ? (INCIDENCIA_LABELS[a.incidencia] || a.incidencia)
                                                                        : PUNCH_STATUS_LABELS[a.status]}
                                                                </Badge>
                                                                {a.marcajes_faltantes.length > 0 && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button type="button" aria-label="Marcajes faltantes">
                                                                                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Faltan: {a.marcajes_faltantes.join(", ")}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.entrada1 || "—"}</td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.salida1 || "—"}</td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.entrada2 || "—"}</td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.salida2 || "—"}</td>
                                                        <td className={cn("px-3 font-mono text-xs font-medium", cellY)}>{minutesToHHMM(a.minutos_trabajados)}</td>
                                                        <td className={cn("px-3 font-mono text-xs", cellY)}>{a.minutos_comida > 0 ? `${a.minutos_comida} min` : "—"}</td>
                                                        <td className={cn("px-3 text-xs font-medium", a.exceso_comida > 0 ? "text-warning" : "text-muted-foreground", cellY)}>
                                                            {a.exceso_comida > 0 ? `${a.exceso_comida} min` : "—"}
                                                        </td>
                                                        <td className={cn("px-3 font-mono text-xs", a.minutos_retardo > 0 ? "text-warning font-medium" : "", cellY)}>
                                                            {a.minutos_retardo > 0 ? `${a.minutos_retardo} min` : "—"}
                                                        </td>
                                                        <td className={cn("px-3 font-mono text-xs", a.minutos_extra > 0 ? "text-info font-medium" : "", cellY)}>
                                                            {a.minutos_extra > 0 ? minutesToHHMM(a.minutos_extra) : "—"}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </TooltipProvider>
                            {filteredAnalyses.length === 0 && punchRows.length > 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Sin resultados con los filtros actuales.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
