"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
    CloudUpload,
    Search,
    Calendar,
    FilePlus,
    AlertCircle,
    Loader2,
    X,
    Info,
    Download,
} from "lucide-react"

import { INCIDENT_TABS, INCIDENCIA_LABELS, AREA_STAFF, ALLOWED_PUESTOS } from "./constants"
import { formatMes, daysInMonth, parseReporteJSON, isIncidence, isIncidentTab, getMexicoHolidayLabels } from "./helpers"
import type { IncidentTab, AreaStaffSummary, ReporteRow, EmployeeRef } from "./types"

import ReporteCalendar from "./reporte-calendar"
import ReporteAreaSummary from "./reporte-area-summary"
import ReporteIncidentTabs from "./reporte-incident-tabs"
import ReporteKpiDashboard from "./reporte-kpi-dashboard"

export default function ReporteDiarioContent() {
    const [rows, setRows] = useState<ReporteRow[]>([])
    const [selectedMes, setSelectedMes] = useState("")
    const [search, setSearch] = useState("")
    const [departamentoFilter, setDepartamentoFilter] = useState("")
    const [turnoFilter, setTurnoFilter] = useState("")
    const [selectedIncidentTab, setSelectedIncidentTab] = useState<IncidentTab>(INCIDENT_TABS[0])
    const [selectedDay, setSelectedDay] = useState("")
    const [selectedArea, setSelectedArea] = useState("")
    const [errors, setErrors] = useState<string[]>([])
    const [fileName, setFileName] = useState("")
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const months = useMemo(
        () => Array.from(new Set(rows.map((r) => r.mes))).sort(),
        [rows],
    )
    const availableDepartments = useMemo(
        () => Array.from(new Set(rows.map((r) => r.departamento))).sort(),
        [rows],
    )
    const availableTurnos = useMemo(
        () => Array.from(new Set(rows.map((r) => r.turno).filter((t): t is string => !!t))).sort(),
        [rows],
    )

    const currentMonth = selectedMes || months[0] || ""
    const dayCount = currentMonth ? daysInMonth(currentMonth) : 0
    const dayHeaders = Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, "0"))

    const selectedRows = useMemo(() => {
        const lower = search.toLowerCase()
        return rows
            .filter((r) => r.mes === currentMonth)
            .filter((r) => {
                if (departamentoFilter && r.departamento !== departamentoFilter) return false
                if (turnoFilter && r.turno !== turnoFilter) return false
                if (!lower) return true
                return (
                    r.nombre.toLowerCase().includes(lower) ||
                    r.numero_empleado.toLowerCase().includes(lower) ||
                    r.departamento.toLowerCase().includes(lower) ||
                    r.area.toLowerCase().includes(lower)
                )
            })
    }, [rows, currentMonth, search, departamentoFilter, turnoFilter])

    const daySummaries = useMemo(() => {
        return dayHeaders.reduce<Record<string, number>>((acc, day) => {
            acc[day] = selectedRows.reduce((n, r) => {
                return n + (isIncidence(r.days[day]) ? 1 : 0)
            }, 0)
            return acc
        }, {})
    }, [dayHeaders, selectedRows])

    const emptyIncident = () => INCIDENT_TABS.reduce(
        (acc, c) => ({ ...acc, [c]: [] as EmployeeRef[] }),
        {} as Record<IncidentTab, EmployeeRef[]>,
    )

    const selectedDayIncidentSummary = useMemo(() => {
        const base = emptyIncident()
        if (!selectedDay) return base
        return selectedRows.reduce((acc, row) => {
            const code = row.days[selectedDay]
            if (!isIncidence(code) || !isIncidentTab(code!)) return acc
            acc[code].push({
                key: `${code}||${row.departamento}||${row.area}||${row.turno || "-"}||${row.numero_empleado}`,
                numero_empleado: row.numero_empleado,
                nombre: row.nombre,
                departamento: row.departamento,
                area: row.area,
                turno: row.turno || "-",
            })
            return acc
        }, base)
    }, [selectedRows, selectedDay])

    const selectedDayAreaSummary = useMemo<AreaStaffSummary[]>(() => {
        if (!selectedDay) return AREA_STAFF.map((area) => ({
            ...area,
            personal_activo: 0,
            personal_incidencia: 0,
            personal_real: area.personal_autorizado,
        }))

        return AREA_STAFF.map((area) => {
            const rowsInArea = selectedRows.filter(
                (row) => row.area === area.area && ALLOWED_PUESTOS.has(row.puesto || ""),
            )
            const personal_activo = rowsInArea.length
            const personal_incidencia = rowsInArea.reduce((count, row) => {
                return count + (isIncidence(row.days[selectedDay]) ? 1 : 0)
            }, 0)
            return {
                ...area,
                personal_activo,
                personal_incidencia,
                personal_real: Math.max(personal_activo - personal_incidencia, 0),
            }
        })
    }, [selectedRows, selectedDay])

    const selectedAreaDetailRows = useMemo(() => {
        if (!selectedDay || !selectedArea) return []

        return selectedRows
            .filter(
                (row) =>
                    row.area === selectedArea &&
                    ALLOWED_PUESTOS.has(row.puesto || "") &&
                    isIncidence(row.days[selectedDay]),
            )
            .map((row) => ({
                key: `${row.numero_empleado}||${row.area}`,
                numero_empleado: row.numero_empleado,
                nombre: row.nombre,
                tipo_incidencia: row.days[selectedDay] || "-",
            }))
    }, [selectedRows, selectedDay, selectedArea])

    const selectedDayCounts = useMemo(() => {
        const base = INCIDENT_TABS.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<IncidentTab, number>)
        if (!selectedDay) return base
        return selectedRows.reduce((acc, row) => {
            const code = row.days[selectedDay]
            if (!isIncidence(code) || !isIncidentTab(code!)) return acc
            acc[code] = (acc[code] || 0) + 1
            return acc
        }, base)
    }, [selectedRows, selectedDay])

    const monthFirstDay = currentMonth ? (() => {
        const [year, month] = currentMonth.split("-").map(Number)
        return new Date(year, month - 1, 1).getDay()
    })() : 0

    const selectedMonthHolidayLabels = useMemo(() => {
        if (!currentMonth) return {} as Record<string, string>
        const [year] = currentMonth.split("-").map(Number)
        return getMexicoHolidayLabels(year)
    }, [currentMonth])

    const calendarCells = Array.from({ length: dayCount + monthFirstDay }, (_, i) =>
        i < monthFirstDay ? null : String(i - monthFirstDay + 1).padStart(2, "0"),
    )

    const processFile = useCallback(async (file: File) => {
        setFileName(file.name)
        setErrors([])
        setLoading(true)
        try {
            const text = await file.text()
            const json = JSON.parse(text)
            const { rows: parsed, errors: errs } = parseReporteJSON(json)
            if (errs.length > 0) { setRows([]); setErrors(errs); return }
            setRows(parsed)
            setSelectedMes(parsed[0]?.mes ?? "")
        } catch (err) {
            setRows([])
            setErrors([`Error leyendo JSON: ${err instanceof Error ? err.message : String(err)}`])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
    }, [processFile])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (!file) return
        await processFile(file)
    }, [processFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleExportPdf = useCallback(async () => {
        if (!selectedDay || !currentMonth) return

        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const dayNum = parseInt(selectedDay, 10)
        const title = `Reporte Diario — ${formatMes(currentMonth)} — Día ${dayNum}`

        doc.setFontSize(14)
        doc.text(title, 14, 20)

        let y = 30

        doc.setFontSize(11)
        doc.text("Resumen por Área", 14, y)
        y += 4
        autoTable(doc, {
            startY: y,
            head: [["Área", "Autorizado", "Activo", "Incidencias", "Personal Real"]],
            body: selectedDayAreaSummary.map((a) => [
                a.area, a.personal_autorizado, a.personal_activo, a.personal_incidencia, a.personal_real,
            ]),
            styles: { fontSize: 8 },
        })

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

        for (const code of INCIDENT_TABS) {
            const rows = selectedDayIncidentSummary[code]
            if (rows.length === 0) continue

            if (y > 260) { doc.addPage(); y = 20 }

            doc.setFontSize(11)
            doc.text(`${INCIDENCIA_LABELS[code] ?? code} (${rows.length})`, 14, y)
            y += 4
            autoTable(doc, {
                startY: y,
                head: [["Empleado", "# Empleado", "Departamento", "Área", "Turno"]],
                body: rows.map((r) => [r.nombre, r.numero_empleado, r.departamento, r.area, r.turno]),
                styles: { fontSize: 8 },
            })
            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        }

        doc.save(`reporte-diario-${currentMonth}-dia-${selectedDay}.pdf`)
    }, [selectedDay, currentMonth, selectedDayAreaSummary, selectedDayIncidentSummary])

    const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5"

    return (
        <div className="flex flex-col gap-5 max-w-full mx-auto pb-12">

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex flex-col gap-4">
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
                    <span>{loading ? "Procesando..." : fileName || "Cargar archivo JSON"}</span>
                    <span className="text-xs text-muted-foreground/60">
                        {isDragging ? "Suelta el archivo aquí" : "Haz clic o arrastra para seleccionar"}
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-dashed border-warning text-sm text-muted-foreground">
                        <Info className="w-4 h-4 shrink-0 text-warning" />
                        <span>
                            <strong className="font-medium text-warning-foreground">
                                Aviso:
                            </strong>
                            {" "}El almacenamiento de los datos es temporal y se perderá al recargar la página.
                        </span>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Mes</span>
                        <Select
                            value={currentMonth}
                            onValueChange={setSelectedMes}
                            disabled={!months.length}
                        >
                            <SelectTrigger className="rounded-lg">
                                <SelectValue placeholder="Seleccionar mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m} value={m}>{formatMes(m)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Departamento</span>
                        <Select
                            value={departamentoFilter || "__all__"}
                            onValueChange={(v) => setDepartamentoFilter(v === "__all__" ? "" : v)}
                            disabled={!availableDepartments.length}
                        >
                            <SelectTrigger className="rounded-lg">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Todos</SelectItem>
                                {availableDepartments.map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Turno</span>
                        <Select
                            value={turnoFilter || "__all__"}
                            onValueChange={(v) => setTurnoFilter(v === "__all__" ? "" : v)}
                            disabled={!availableTurnos.length}
                        >
                            <SelectTrigger className="rounded-lg">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Todos</SelectItem>
                                {availableTurnos.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Buscar</span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Nombre, número o área"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 rounded-lg border-border bg-background text-sm focus-visible:ring-primary/10 focus-visible:border-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Dashboard ─────────────────────────────────────────── */}
            {currentMonth && rows.length > 0 && (
                <ReporteKpiDashboard
                    selectedRows={selectedRows}
                    dayHeaders={dayHeaders}
                    currentMonth={currentMonth}
                />
            )}

            {/* ── Calendar ─────────────────────────────────────────────── */}
            {currentMonth && rows.length > 0 && (
                <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border px-5 py-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Calendario mensual</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Selecciona un día para ver el detalle de incidencias.
                                </p>
                            </div>
                            <span className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                                {formatMes(currentMonth)}
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="px-3 py-4 sm:px-5 sm:py-5">
                        <ReporteCalendar
                            calendarCells={calendarCells}
                            daySummaries={daySummaries}
                            selectedDay={selectedDay}
                            selectedMonthHolidayLabels={selectedMonthHolidayLabels}
                            currentMonth={currentMonth}
                            onSelectDay={setSelectedDay}
                        />

                        {/* Day detail panel */}
                        <div className="mt-5 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center justify-between gap-2.5 border-b border-border px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <p className="text-sm font-semibold text-foreground">
                                        {selectedDay ? `Incidencias — día ${parseInt(selectedDay, 10)}` : "Detalles del día"}
                                    </p>
                                </div>
                                {selectedDay && (
                                    <button
                                        type="button"
                                        onClick={handleExportPdf}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-foreground/40"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Exportar PDF
                                    </button>
                                )}
                            </div>

                            <div className="px-3 py-4 sm:px-5">
                                {!selectedDay ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Selecciona un día en el calendario.
                                    </p>
                                ) : (
                                    <>
                                        <ReporteAreaSummary
                                            areas={selectedDayAreaSummary}
                                            selectedArea={selectedArea}
                                            onSelectArea={setSelectedArea}
                                            detailRows={selectedAreaDetailRows}
                                        />

                                        <ReporteIncidentTabs
                                            selectedTab={selectedIncidentTab}
                                            onSelectTab={setSelectedIncidentTab}
                                            dayCounts={selectedDayCounts}
                                            incidentSummary={selectedDayIncidentSummary}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {!fileName && rows.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
                    <FilePlus className="mb-3 w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">Carga un archivo JSON para comenzar.</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">El archivo debe seguir el formato de reporte diario.</p>
                </div>
            )}

            {/* ── Errors ───────────────────────────────────────────────── */}
            {errors.length > 0 && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                            <h3 className="text-sm font-semibold text-destructive">Errores de formato</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setErrors([])}
                            className="rounded-md p-1 text-destructive/60 transition hover:text-destructive hover:bg-destructive/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <ul className="space-y-1.5">
                        {errors.map((err, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-destructive/90">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/60" />
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
