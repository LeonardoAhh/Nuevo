"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
}
from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { format, getISOWeek } from "date-fns"
import { es } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    CloudUpload,
    Calendar,
    AlertCircle,
    Loader2,
    X,
    Download,
    Save,
    Check,
    Database,
    Trash2,
    Clock,
    UserX,
    Building2,
    SunMedium,
    User,
    ChevronRight,
    ChevronLeft,
    FileJson,
} from "lucide-react"

import { INCIDENT_TABS, INCIDENCIA_LABELS, AREA_STAFF, ALLOWED_PUESTOS } from "./constants"
import { formatMes, daysInMonth, parseReporteJSON, isIncidence, isIncidentTab, getMexicoHolidayLabels } from "./helpers"
import type { IncidentTab, AreaStaffSummary, ReporteRow, EmployeeRef } from "./types"

import ReporteCalendar from "./reporte-calendar"
import ReporteAreaSummary from "./reporte-area-summary"
import ReporteIncidentTabs from "./reporte-incident-tabs"
import ReporteKpiDashboard from "./reporte-kpi-dashboard"
import ReporteComparison from "./reporte-comparison"
import ReporteEmployeeDetail from "./reporte-employee-detail"
import ReportesGuardadosDialog from "./reportes-guardados-dialog"
import ReporteInsights from "./reporte-insights"
import { useReporteDiario } from "@/lib/hooks/useReporteDiario"
import type { ReporteDiarioSummary } from "@/lib/hooks/useReporteDiario"

export default function ReporteDiarioContent() {
    const [rows, setRows] = useState<ReporteRow[]>([])
    const [selectedMes, setSelectedMes] = useState("")
    const [search, setSearch] = useState("")
    const [selectedEmployee, setSelectedEmployee] = useState<string>("")
    const [empDetailOpen, setEmpDetailOpen] = useState(false)
    const [departamentoFilter, setDepartamentoFilter] = useState("")
    const [turnoFilter, setTurnoFilter] = useState("")
    const [selectedIncidentTab, setSelectedIncidentTab] = useState<IncidentTab | "">("")
    const [selectedDay, setSelectedDay] = useState("")
    const [selectedArea, setSelectedArea] = useState("")
    const [errors, setErrors] = useState<string[]>([])
    const [fileName, setFileName] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const [processStep, setProcessStep] = useState<"reading" | "validating" | "generating" | null>(null)
    const [previewData, setPreviewData] = useState<{
        rows: ReporteRow[];
        mes: string;
        fileName: string;
        jsonRaw: unknown;
    } | null>(null)

    const {
        loading: dbLoading,
        saving: dbSaving,
        fetchSummaries,
        fetchByMes,
        saveReport,
        deleteReport,
    } = useReporteDiario()

    const [savedSummaries, setSavedSummaries] = useState<ReporteDiarioSummary[]>([])
    const [loadingDb, setLoadingDb] = useState(true)

    // Recuperar último reporte parseado si se recarga la página por accidente
    useEffect(() => {
        const cached = sessionStorage.getItem("reporteDiarioCache")
        if (cached) {
            try {
                const json = JSON.parse(cached)
                const { rows: parsed, errors: errs } = parseReporteJSON(json)
                if (errs.length === 0 && parsed.length > 0) {
                    setRows(parsed)
                    setSelectedMes(parsed[0]?.mes ?? "")
                    setFileName("Autoguardado: Recuperado de sesión")
                }
            } catch (err) {
                // Si falla el parseo, solo ignoramos la caché
            }
        }
    }, [])

    useEffect(() => {
        fetchSummaries().then((data) => {
            setSavedSummaries(data)
            setLoadingDb(false)
        })
    }, [fetchSummaries])

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

    const dayAusentismoPct = useMemo(() => {
        const total = selectedRows.length
        if (total === 0) return {} as Record<string, number>
        return dayHeaders.reduce<Record<string, number>>((acc, day) => {
            const hasAnyCode = selectedRows.some((r) => !!r.days[day])
            if (!hasAnyCode) {
                return acc
            }

            const ausentes = selectedRows.reduce((n, r) => {
                const code = r.days[day]
                return n + (code === "F" || code === "P" || code === "I" ? 1 : 0)
            }, 0)
            acc[day] = Math.round((ausentes / total) * 100 * 100) / 100
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
        const result = selectedRows.reduce((acc, row) => {
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
        for (const tab of INCIDENT_TABS) {
            result[tab].sort((a, b) => a.area.localeCompare(b.area))
        }
        return result
    }, [selectedRows, selectedDay])

    const selectedDayAreaSummary = useMemo<AreaStaffSummary[]>(() => {
        if (!selectedDay) return AREA_STAFF.map((area) => ({
            ...area,
            personal_activo: 0,
            personal_incidencia: 0,
            personal_real: area.personal_autorizado,
        }))

        let dayOfWeek = -1
        if (currentMonth && selectedDay) {
            const [year, month] = currentMonth.split("-").map(Number)
            dayOfWeek = new Date(year, month - 1, parseInt(selectedDay, 10)).getDay()
        }

        return AREA_STAFF.map((area) => {
            const rowsInArea = selectedRows.filter(
                (row) => row.area === area.area && ALLOWED_PUESTOS.has(row.puesto || ""),
            )
            const personal_activo = rowsInArea.length
            const personal_incidencia = rowsInArea.reduce((count, row) => {
                return count + (isIncidence(row.days[selectedDay]) ? 1 : 0)
            }, 0)

            let is_descanso = false
            if (dayOfWeek !== -1) {
                if (area.area === "PRODUCCIÓN 1ER. TURNO" && dayOfWeek === 0) {
                    // Domingo
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 2o. TURNO" && (dayOfWeek === 1 || dayOfWeek === 2)) {
                    // Lunes y Martes
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 3ER. TURNO" && (dayOfWeek === 3 || dayOfWeek === 4)) {
                    // Miércoles y Jueves
                    is_descanso = true
                } else if (area.area === "PRODUCCIÓN 4o. TURNO" && (dayOfWeek === 5 || dayOfWeek === 6)) {
                    // Viernes y Sábado
                    is_descanso = true
                }
            }

            return {
                ...area,
                personal_activo,
                personal_incidencia,
                personal_real: Math.max(personal_activo - personal_incidencia, 0),
                is_descanso,
            }
        })
    }, [selectedRows, selectedDay, currentMonth])

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
                puesto: row.puesto,
                turno: row.turno,
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

    const daysWithData = useMemo(() => {
        return dayHeaders.filter(day => dayAusentismoPct[day] !== undefined || (daySummaries[day] ?? 0) > 0)
    }, [dayHeaders, dayAusentismoPct, daySummaries])

    const currentDayIndex = selectedDay ? daysWithData.indexOf(selectedDay) : -1
    const prevDay = currentDayIndex > 0 ? daysWithData[currentDayIndex - 1] : null
    const nextDay = currentDayIndex !== -1 && currentDayIndex < daysWithData.length - 1 ? daysWithData[currentDayIndex + 1] : null

    const selectedDateTitle = useMemo(() => {
        if (!selectedDay || !currentMonth) return ""
        try {
            const dateStr = `${currentMonth}-${selectedDay}`
            const date = new Date(dateStr + "T00:00:00")

            const weekday = format(date, "EEEE", { locale: es })
            const day = format(date, "d", { locale: es })
            const month = format(date, "MMMM", { locale: es })
            const year = format(date, "yyyy", { locale: es })

            const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
            const capMonth = month.charAt(0).toUpperCase() + month.slice(1)
            const weekNum = getISOWeek(date)

            return `${capWeekday} ${day} ${capMonth} ${year} - Semana ${weekNum}`
        } catch {
            return `Incidencias — día ${parseInt(selectedDay, 10)}`
        }
    }, [selectedDay, currentMonth])

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
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            toast.error("Formato de archivo inválido. Por favor, asegúrate de subir el archivo correcto.")
            return
        }

        setErrors([])
        setProcessStep("reading")
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

        try {
            await delay(1200) // Simulación de lectura (más tiempo)
            const text = await file.text()
            
            setProcessStep("validating")
            await delay(2000) // Simulación de validación (más tiempo)

            const json = JSON.parse(text)
            const { rows: parsed, errors: errs } = parseReporteJSON(json)
            
            if (errs.length > 0) { 
                setProcessStep(null)
                setErrors(errs)
                toast.error("Se encontraron inconsistencias al revisar el archivo de datos")
                return 
            }
            
            setPreviewData({
                rows: parsed,
                mes: parsed[0]?.mes ?? "",
                fileName: file.name,
                jsonRaw: json
            })
            setProcessStep(null)
        } catch (err) {
            setProcessStep(null)
            const msg = `Error al revisar el archivo: ${err instanceof Error ? err.message : String(err)}`
            setErrors([msg])
            toast.error("El archivo está corrupto o no tiene la estructura esperada")
        }
    }, [])

    const confirmLoad = useCallback(async () => {
        if (!previewData) return
        setProcessStep("generating")
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
        await delay(1500) // Simulación de generación (más tiempo)

        setRows(previewData.rows)
        setSelectedMes(previewData.mes)
        setFileName(previewData.fileName)
        sessionStorage.setItem("reporteDiarioCache", JSON.stringify(previewData.jsonRaw))
        
        setProcessStep(null)
        setPreviewData(null)
        toast.success(`Información del mes de ${formatMes(previewData.mes)} cargada con éxito`)
    }, [previewData])

    const cancelLoad = useCallback(() => {
        setPreviewData(null)
        setProcessStep(null)
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
        if (!isDragging) setIsDragging(true)
    }, [isDragging])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        // Solo quitamos isDragging si salimos del documento principal
        if (e.relatedTarget === null || (e.relatedTarget as HTMLElement).nodeName === "HTML") {
            setIsDragging(false)
        }
    }, [])

    const handleClearFile = useCallback(() => {
        setRows([])
        setFileName("")
        setErrors([])
        sessionStorage.removeItem("reporteDiarioCache")
        toast.info("Vista de datos limpiada")
    }, [])

    const computeKpis = useCallback((reportRows: ReporteRow[], dayH: string[]) => {
        let totalIncidencias = 0
        let totalAsistencias = 0
        let totalDaysTracked = 0
        for (const row of reportRows) {
            for (const day of dayH) {
                const code = row.days[day]
                if (!code || code === "-" || code === "X") continue
                totalDaysTracked++
                if (code === "A") totalAsistencias++
                else if (isIncidence(code)) totalIncidencias++
            }
        }
        const tasaAsistencia = totalDaysTracked > 0
            ? Math.round((totalAsistencias / totalDaysTracked) * 100 * 100) / 100
            : 0
        return { totalIncidencias, tasaAsistencia }
    }, [])

    const heroKpis = useMemo(
        () => computeKpis(selectedRows, dayHeaders),
        [computeKpis, selectedRows, dayHeaders],
    )

    const handleSaveToDb = useCallback(async () => {
        if (!currentMonth || rows.length === 0) return
        const monthRows = rows.filter((r) => r.mes === currentMonth)
        const dCount = daysInMonth(currentMonth)
        const dHeaders = Array.from({ length: dCount }, (_, i) => String(i + 1).padStart(2, "0"))
        const { totalIncidencias, tasaAsistencia } = computeKpis(monthRows, dHeaders)

        const diasDisponibles = monthRows.length * dCount
        let totalAusentismo = 0
        for (const row of monthRows) {
            for (const day of dHeaders) {
                const code = row.days[day]
                if (code === "F" || code === "P" || code === "I") {
                    totalAusentismo++
                }
            }
        }
        const pctAusentismo = diasDisponibles > 0
            ? Math.round((totalAusentismo / diasDisponibles) * 100 * 100) / 100
            : 0

        const result = await saveReport({
            mes: currentMonth,
            data: monthRows,
            total_empleados: monthRows.length,
            total_incidencias: totalIncidencias,
            tasa_asistencia: tasaAsistencia,
            dias_disponibles: diasDisponibles,
            total_ausentismo: totalAusentismo,
            pct_ausentismo: pctAusentismo,
        })
        if (result.success) {
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3500)
            const updated = await fetchSummaries()
            setSavedSummaries(updated)
        }
    }, [currentMonth, rows, computeKpis, saveReport, fetchSummaries])

    const handleLoadFromDb = useCallback(async (mes: string) => {
        const record = await fetchByMes(mes)
        if (!record) return
        const { rows: parsed, errors: errs } = parseReporteJSON(record.data as unknown[])
        if (errs.length > 0) {
            setErrors(errs)
            return
        }
        setRows(parsed)
        setSelectedMes(mes)
        setFileName(`Guardado: ${formatMes(mes)}`)
        setErrors([])
    }, [fetchByMes])

    const handleDeleteFromDb = useCallback(async (id: string) => {
        const result = await deleteReport(id)
        if (result.success) {
            const updated = await fetchSummaries()
            setSavedSummaries(updated)
        }
    }, [deleteReport, fetchSummaries])

    const handleExportPdf = useCallback(async () => {
        if (!selectedDay || !currentMonth) return

        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default
        const { addReportFooter } = await import("@/lib/pdf-footer")

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

        addReportFooter(doc)
        doc.save(`reporte-diario-${currentMonth}-dia-${selectedDay}.pdf`)
    }, [selectedDay, currentMonth, selectedDayAreaSummary, selectedDayIncidentSummary])

    const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5"

    const hasData = rows.length > 0 && Boolean(currentMonth)

    return (
        <div className="flex flex-col gap-5 max-w-full mx-auto pb-12">

            {/* ── Header ───────────────────────────────────────────────── */}
            <TooltipProvider delayDuration={200}>
            <header className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Reporte Diario</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Asistencia e incidencias · planta Querétaro</p>
                    </div>

                    {fileName && hasData && (
                        <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 bg-muted/40 border border-border rounded-full text-xs font-medium text-muted-foreground transition-all hover:bg-muted/60">
                            <FileJson className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate max-w-[200px]">{fileName}</span>
                            <button onClick={handleClearFile} className="ml-1 text-muted-foreground hover:text-destructive transition" title="Limpiar archivo actual">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 ml-2">


                        {/* Retardos */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/retardos"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground transition hover:text-primary hover:bg-primary/10"
                                >
                                    <Clock className="w-4 h-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p className="text-xs">Retardos y marcajes</p></TooltipContent>
                        </Tooltip>

                        {/* Ausentismo */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/reporte-diario/ausentismo"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
                                >
                                    <UserX className="w-4 h-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p className="text-xs">Ranking de ausentismo</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* ── Filter controls (visible when data loaded) ── */}
                    {hasData && (
                        <>
                            {/* Mes */}

                            {/* Departamento */}
                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex items-center justify-center h-8 w-8 rounded-md transition",
                                                    departamentoFilter ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                                                )}
                                            >
                                                <Building2 className="w-4 h-4" />
                                            </button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p className="text-xs">Departamento</p></TooltipContent>
                                </Tooltip>
                                <PopoverContent align="end" className="w-72 p-4 rounded-xl border-border shadow-xl">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                            <Building2 className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Departamento</span>
                                        </div>
                                        <Select value={departamentoFilter || "__all__"} onValueChange={(v) => setDepartamentoFilter(v === "__all__" ? "" : v)} disabled={!availableDepartments.length}>
                                            <SelectTrigger className="rounded-lg bg-muted/30 border-border/50"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">Todos</SelectItem>
                                                {availableDepartments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Turno */}
                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex items-center justify-center h-8 w-8 rounded-md transition",
                                                    turnoFilter ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                                                )}
                                            >
                                                <SunMedium className="w-4 h-4" />
                                            </button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p className="text-xs">Turno</p></TooltipContent>
                                </Tooltip>
                                <PopoverContent align="end" className="w-64 p-4 rounded-xl border-border shadow-xl">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                            <SunMedium className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Turno</span>
                                        </div>
                                        <Select value={turnoFilter || "__all__"} onValueChange={(v) => setTurnoFilter(v === "__all__" ? "" : v)} disabled={!availableTurnos.length}>
                                            <SelectTrigger className="rounded-lg bg-muted/30 border-border/50"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">Todos</SelectItem>
                                                {availableTurnos.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Empleado */}
                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex items-center justify-center h-8 w-8 rounded-md transition",
                                                    selectedEmployee ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                                                )}
                                            >
                                                <User className="w-4 h-4" />
                                            </button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p className="text-xs">Empleado</p></TooltipContent>
                                </Tooltip>
                                <PopoverContent align="end" className="w-80 p-4 rounded-xl border-border shadow-xl">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                            <User className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Empleado</span>
                                        </div>
                                        <Select
                                            value={selectedEmployee || "__none__"}
                                            onValueChange={(v) => {
                                                if (v === "__none__") { setSelectedEmployee(""); setSearch("") }
                                                else { setSelectedEmployee(v); setSearch(""); setEmpDetailOpen(true) }
                                            }}
                                            disabled={!selectedRows.length}
                                        >
                                            <SelectTrigger className="rounded-lg bg-muted/30 border-border/50"><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                <SelectItem value="__none__">Todos</SelectItem>
                                                {selectedRows.slice().sort((a, b) => parseInt(a.numero_empleado, 10) - parseInt(b.numero_empleado, 10)).map((r) => (
                                                    <SelectItem key={r.numero_empleado} value={r.numero_empleado}>
                                                        {r.numero_empleado} - {r.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Save */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={handleSaveToDb}
                                        disabled={dbSaving || saveSuccess}
                                        className={cn(
                                            "inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors",
                                            saveSuccess ? "text-green-500 bg-green-500/10" : "text-primary hover:bg-primary/10",
                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                        )}
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            {saveSuccess ? (
                                                <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                    <Check className="w-4 h-4" />
                                                </motion.div>
                                            ) : dbSaving ? (
                                                <motion.div key="saving" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="save" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                    <Save className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p className="text-xs">Guardar {formatMes(currentMonth)}</p></TooltipContent>
                            </Tooltip>

                            <div className="h-5 w-px bg-border mx-1" />
                        </>
                    )}

                    {hasData && (
                        <div className="flex items-center gap-5 sm:gap-6">
                            <div className="text-right">
                                <p className="text-2xl font-bold leading-none tracking-tight text-warning sm:text-3xl">
                                    {heroKpis.totalIncidencias}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Incidencias</p>
                            </div>
                            <span className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                                {formatMes(currentMonth)}
                            </span>
                        </div>
                    )}
                </div>
            </header>
            </TooltipProvider>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* ── Top Grid (Acciones & Insights) ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {(savedSummaries.length >= 2) && (
                    <ReporteComparison summaries={savedSummaries} />
                )}
                {(savedSummaries.length > 0) && (
                    <ReportesGuardadosDialog 
                        savedSummaries={savedSummaries}
                        dbSaving={dbSaving}
                        onLoad={handleLoadFromDb}
                        onDelete={handleDeleteFromDb}
                        formatMes={formatMes}
                    />
                )}
                
                {hasData && currentMonth && selectedRows.length > 0 && (
                    <ReporteInsights 
                        selectedRows={selectedRows}
                        dayHeaders={dayHeaders}
                        dayAusentismoPct={dayAusentismoPct}
                    />
                )}
            </div>

            {hasData ? (
                <div className="flex flex-col gap-5">

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
                            dayAusentismoPct={dayAusentismoPct}
                            selectedDay={selectedDay}
                            selectedMonthHolidayLabels={selectedMonthHolidayLabels}
                            currentMonth={currentMonth}
                            onSelectDay={setSelectedDay}
                        />
                    </CardContent>
                </Card>
            )}

            {/* ── Detalle del día ──── */}
            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                            <CardHeader className="bg-muted/40 border-b border-border px-5 py-4">
                                <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-semibold text-foreground">
                                            {selectedDay ? selectedDateTitle : "Detalle del día"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedDay && (
                                            <div className="flex items-center gap-1 mr-2 border border-border rounded-md p-0.5 bg-muted/20">
                                                <button
                                                    type="button"
                                                    onClick={() => prevDay && setSelectedDay(prevDay)}
                                                    disabled={!prevDay}
                                                    className="p-1 rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                    title="Día anterior"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => nextDay && setSelectedDay(nextDay)}
                                                    disabled={!nextDay}
                                                    className="p-1 rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                    title="Día siguiente"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {selectedDay && (
                                            <button
                                                type="button"
                                                onClick={handleExportPdf}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-foreground/40"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                PDF
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 py-4 sm:px-5">
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
                            </CardContent>
                        </Card>
                </div>
            ) : (
                <div 
                    className="flex flex-col items-center justify-center py-24 px-4 border-2 border-dashed border-border rounded-2xl bg-muted/10 transition-all hover:bg-muted/30 cursor-pointer group"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-16 h-16 bg-background border border-border shadow-sm rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                        <CloudUpload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Sube tu reporte diario</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
                        Arrastra y suelta tu archivo <span className="font-medium text-foreground">de datos</span> aquí, o haz clic para seleccionarlo desde tus carpetas.
                    </p>
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

            {/* ── Employee Detail Modal ────────────────────────────────── */}
            <ReporteEmployeeDetail
                open={empDetailOpen}
                onClose={() => { setEmpDetailOpen(false); setSelectedEmployee("") }}
                employee={selectedRows.find((r) => r.numero_empleado === selectedEmployee) ?? null}
                dayHeaders={dayHeaders}
                currentMonth={currentMonth}
            />

            {/* ── Preview Modal ────────────────────────────────── */}
            <Dialog open={!!previewData} onOpenChange={(open) => !open && cancelLoad()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Revisión rápida del archivo</DialogTitle>
                    </DialogHeader>
                    {previewData && (
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                                    <FileJson className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[250px]">{previewData.fileName}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Se encontraron <span className="font-semibold text-foreground">{previewData.rows.length}</span> registros de asistencia para el mes de <span className="font-semibold text-foreground capitalize">{formatMes(previewData.mes)}</span>.
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-foreground text-center">¿Deseas aplicar esta información en tu tablero?</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={cancelLoad}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmLoad}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Check className="w-4 h-4" />
                            Sí, cargar datos
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Processing Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {processStep && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 10 }}
                            className="flex flex-col items-center bg-card p-10 rounded-3xl shadow-2xl border border-border/50"
                        >
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                                <Loader2 className="w-10 h-10 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {processStep === "reading" && "Leyendo archivo..."}
                                {processStep === "validating" && "Revisando incidencias..."}
                                {processStep === "generating" && "Construyendo tu tablero..."}
                            </h2>
                            <p className="text-muted-foreground mt-2 text-center max-w-xs">
                                {processStep === "reading" && "Por favor, espera un momento."}
                                {processStep === "validating" && "Asegurando que la información sea correcta."}
                                {processStep === "generating" && "Solo tomará un segundo más."}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Save Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {(dbSaving || saveSuccess) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="flex flex-col items-center justify-center p-10 bg-card rounded-[2rem] shadow-2xl border border-border/50 min-w-[320px]"
                        >
                            <AnimatePresence mode="wait">
                                {saveSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                        className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6"
                                    >
                                        <Check className="w-12 h-12 stroke-[3]" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="saving"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6"
                                    >
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.h2
                                key={saveSuccess ? "title-success" : "title-saving"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-foreground"
                            >
                                {saveSuccess ? "¡Guardado Exitoso!" : "Guardando reporte..."}
                            </motion.h2>
                            <motion.p
                                key={saveSuccess ? "desc-success" : "desc-saving"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-muted-foreground mt-2 text-center"
                            >
                                {saveSuccess ? "La información se ha sincronizado." : "Por favor, espera un momento."}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Global Drag Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md border-[8px] border-dashed border-primary/40 m-4 rounded-[2.5rem]"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            className="flex flex-col items-center pointer-events-none"
                        >
                            <div className="w-28 h-28 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                <FileJson className="w-14 h-14" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Suelta tu archivo aquí</h2>
                            <p className="text-muted-foreground mt-3 text-lg">El reporte se generará automáticamente</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
