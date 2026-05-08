"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "../ui/alert"
import { Info } from "lucide-react"
import { CloudUpload, ChevronDown, Search } from "lucide-react"

/* ─── Constants ──────────────────────────────────────────────────────────── */

const INCIDENCIA_LABELS: Record<string, string> = {
    "-": "No contratado",
    A: "Asistencia",
    F: "Falta injustificada",
    DF: "Día festivo",
    FJ: "Faltas just.",
    S: "Sanción",
    P: "Permiso",
    CT: "Cambio turno",
    I: "Incapacidad",
    V: "Vacación",
    TXT: "T. por tiempo",
    D: "Descanso",
    PH: "Permiso horas",
    X: "Sin incidencia",
}

const INCIDENT_TABS = [
    "F", "FJ", "S", "P", "CT", "I", "V", "TXT", "PH",
] as const

type IncidentTab = (typeof INCIDENT_TABS)[number]

type MexicoHolidayRule =
    | { label: string; month: number; day: number; fixed: true }
    | { label: string; month: number; weekday: number; occurrence: number }

const MEXICO_HOLIDAY_RULES: readonly MexicoHolidayRule[] = [
    { label: "Año Nuevo", month: 0, day: 1, fixed: true },
    { label: "Día de la Constitución", month: 1, weekday: 1, occurrence: 1 },
    { label: "Benito Juárez", month: 2, weekday: 1, occurrence: 3 },
    { label: "Día del Trabajo", month: 4, day: 1, fixed: true },
    { label: "Independencia", month: 8, day: 16, fixed: true },
    { label: "Revolución", month: 10, weekday: 1, occurrence: 3 },
    { label: "Navidad", month: 11, day: 25, fixed: true },
]

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
    const date = new Date(year, month, 1)
    let count = 0
    while (date.getMonth() === month) {
        if (date.getDay() === weekday) {
            count += 1
            if (count === occurrence) return new Date(date)
        }
        date.setDate(date.getDate() + 1)
    }
    return null
}

function getMexicoHolidayLabels(year: number) {
    return MEXICO_HOLIDAY_RULES.reduce<Record<string, string>>((acc, rule) => {
        if ("fixed" in rule) {
            const key = `${String(rule.month + 1).padStart(2, "0")}-${String(rule.day).padStart(2, "0")}`
            acc[key] = rule.label
            return acc
        }

        const holiday = getNthWeekdayOfMonth(year, rule.month, rule.weekday, rule.occurrence)
        if (holiday) {
            const key = `${String(holiday.getMonth() + 1).padStart(2, "0")}-${String(holiday.getDate()).padStart(2, "0")}`
            acc[key] = rule.label
        }
        return acc
    }, {})
}

const AREA_STAFF = [
    { area: "A. CALIDAD 1ER TURNO", personal_autorizado: 22 },
    { area: "A. CALIDAD 2DO. TURNO", personal_autorizado: 22 },
    { area: "PRODUCCIÓN 1ER. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 2o. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 3ER. TURNO", personal_autorizado: 32 },
    { area: "PRODUCCIÓN 4o. TURNO", personal_autorizado: 32 },
] as const

const ALLOWED_PUESTOS = new Set([
    "OPERADOR DE ACABADOS GP-12 A",
    "OPERADOR DE ACABADOS GP-12 B",
    "OPERADOR DE ACABADOS GP-12 C",
    "OPERADOR DE ACABADOS GP-12 D",
    "OPERADOR DE MÁQUINA A",
    "OPERADOR DE MÁQUINA B",
    "OPERADOR DE MÁQUINA C",
    "OPERADOR DE MÁQUINA D",
])

type AreaStaffDefinition = (typeof AREA_STAFF)[number]

type AreaStaffSummary = AreaStaffDefinition & {
    personal_activo: number
    personal_incidencia: number
    personal_real: number
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ReporteRow {
    mes: string
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    puesto?: string
    turno?: string
    days: Record<string, string>
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatMes(ym: string) {
    const [year, month] = ym.split("-")
    const names = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]
    return `${names[parseInt(month, 10) - 1] ?? month} ${year}`
}

function daysInMonth(ym: string) {
    const [year, month] = ym.split("-").map(Number)
    return new Date(year, month, 0).getDate()
}

function normalizeString(value: unknown) {
    if (typeof value !== "string") return ""
    return value.trim()
}

function parseReporteJSON(raw: unknown[]): { rows: ReporteRow[]; errors: string[] } {
    const rows: ReporteRow[] = []
    const errors: string[] = []

    raw.forEach((item, index) => {
        if (typeof item !== "object" || item === null) {
            errors.push(`Elemento ${index + 1} no es un objeto válido`)
            return
        }

        const row = item as Record<string, unknown>
        const mes = normalizeString(row.mes)
        const numero_empleado = normalizeString(row.numero_empleado)
        const nombre = normalizeString(row.nombre)
        const departamento = normalizeString(row.departamento)
        const area = normalizeString(row.area ?? row["área"])
        const puesto = normalizeString(row.puesto)
        const turno = normalizeString(row.turno)

        if (!mes || !/^\d{4}-\d{2}$/.test(mes)) { errors.push(`Fila ${index + 1}: mes inválido, use YYYY-MM`); return }
        if (!numero_empleado) { errors.push(`Fila ${index + 1}: falta numero_empleado`); return }
        if (!nombre) { errors.push(`Fila ${index + 1}: falta nombre`); return }
        if (!departamento) { errors.push(`Fila ${index + 1}: falta departamento`); return }
        if (!area) { errors.push(`Fila ${index + 1}: falta área`); return }

        const days: Record<string, string> = {}
        Object.entries(row).forEach(([key, value]) => {
            if (!/^\d{2}$/.test(key)) return
            days[key] = normalizeString(value) || ""
        })

        rows.push({ mes, numero_empleado, nombre, departamento, area, puesto, turno, days })
    })

    return { rows, errors }
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const IconUpload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
)
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
)
const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
)
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)
const IconEmpty = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)
const IconFile = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
)
const IconAlert = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function ReporteDiarioContent() {
    const [rows, setRows] = useState<ReporteRow[]>([])
    const [selectedMes, setSelectedMes] = useState<string>("")
    const [search, setSearch] = useState("")
    const [departamentoFilter, setDepartamentoFilter] = useState("")
    const [turnoFilter, setTurnoFilter] = useState("")
    const [selectedIncidentTab, setSelectedIncidentTab] = useState<IncidentTab>(INCIDENT_TABS[0])
    const [selectedDay, setSelectedDay] = useState<string>("")
    const [selectedArea, setSelectedArea] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])
    const [fileName, setFileName] = useState<string>("")

    const months = useMemo(
        () => Array.from(new Set(rows.map((r) => r.mes))).sort(),
        [rows],
    )
    const availableDepartments = useMemo(
        () => Array.from(new Set(rows.map((r) => r.departamento))).sort(),
        [rows],
    )
    const availableTurnos = useMemo(
        () => Array.from(new Set(rows.map((r) => r.turno).filter(Boolean))).sort(),
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
                const v = r.days[day]
                return n + (v && v !== "-" && v !== "X" && v !== "A" && v !== "D" && v !== "DF" ? 1 : 0)
            }, 0)
            return acc
        }, {})
    }, [dayHeaders, selectedRows])

    type EmployeeRef = {
        key: string; numero_empleado: string; nombre: string
        departamento: string; area: string; turno: string
    }
    const emptyIncident = () => INCIDENT_TABS.reduce(
        (acc, c) => ({ ...acc, [c]: [] as EmployeeRef[] }),
        {} as Record<IncidentTab, EmployeeRef[]>,
    )

    const selectedDayIncidentSummary = useMemo(() => {
        const base = emptyIncident()
        if (!selectedDay) return base
        return selectedRows.reduce((acc, row) => {
            const code = row.days[selectedDay]
            if (!code || code === "-" || code === "X" || code === "A" || code === "D" || code === "DF" || !INCIDENT_TABS.includes(code as IncidentTab)) return acc
            acc[code as IncidentTab].push({
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
                const code = row.days[selectedDay]
                const isIncidence = !!code && code !== "A" && code !== "D" && code !== "DF" && code !== "X" && code !== "-"
                return count + (isIncidence ? 1 : 0)
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
                    !!row.days[selectedDay] &&
                    row.days[selectedDay] !== "-" &&
                    row.days[selectedDay] !== "A" &&
                    row.days[selectedDay] !== "D" &&
                    row.days[selectedDay] !== "DF" &&
                    row.days[selectedDay] !== "X",
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
            if (!code || code === "-" || code === "X" || code === "A" || code === "D" || code === "DF" || !INCIDENT_TABS.includes(code as IncidentTab)) return acc
            acc[code as IncidentTab] = (acc[code as IncidentTab] || 0) + 1
            return acc
        }, base)
    }, [selectedRows, selectedDay])

    const weekDayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        setErrors([])
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
        }
    }

    /* ── shared class strings using Tailwind theme tokens ── */
    const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5"
    const selectCls = "w-full appearance-none rounded-lg border border-border bg-background px-3 py-[7px] text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-border/80 disabled:opacity-50"

    return (
        <div className="flex flex-col gap-5 max-w-full mx-auto pb-12">

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex flex-col gap-4">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-10 py-6 text-sm text-muted-foreground transition hover:border-primary hover:bg-background active:scale-95">
                    <CloudUpload className="w-7 h-7 text-muted-foreground/60" />
                    <span>{fileName ?? "Cargar archivo JSON"}</span>
                    <span className="text-xs text-muted-foreground/60">Haz clic para seleccionar</span>
                    <input type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
                </label>

                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-dashed text-sm"
                        style={{
                            borderColor: 'hsl(var(--warning))',
                            color: 'hsl(var(--muted-foreground))',
                        }}>
                        <Info className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
                        <span>
                            <strong
                                className="font-medium"
                                style={{ color: 'hsl(var(--warning-foreground))' }}>
                                Aviso:
                            </strong>
                            {' '}El almacenamiento de los datos es temporal y se perderá al recargar la página.
                        </span>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Mes</span>
                        <div className="relative">
                            <select value={currentMonth} onChange={(e) => setSelectedMes(e.target.value)}
                                className={selectCls} disabled={!months.length}>
                                {months.map((m) => <option key={m} value={m}>{formatMes(m)}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Departamento</span>
                        <div className="relative">
                            <select value={departamentoFilter} onChange={(e) => setDepartamentoFilter(e.target.value)}
                                className={selectCls} disabled={!availableDepartments.length}>
                                <option value="">Todos</option>
                                {availableDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Turno</span>
                        <div className="relative">
                            <select value={turnoFilter} onChange={(e) => setTurnoFilter(e.target.value)}
                                className={selectCls} disabled={!availableTurnos.length}>
                                <option value="">Todos</option>
                                {availableTurnos.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className={labelCls}>Buscar</span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input placeholder="Nombre, número o área" value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 rounded-lg border-border bg-background text-sm focus-visible:ring-primary/10 focus-visible:border-primary" />
                        </div>
                    </div>
                </div>
            </div>


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

                    <CardContent className="px-4 py-5 sm:px-5">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                            {weekDayNames.map((n) => (
                                <div key={n} className="py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {n}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {calendarCells.map((day, idx) => {
                                if (!day) return <div key={idx} />
                                const count = daySummaries[day] ?? 0
                                const active = day === selectedDay
                                const holidayLabel = selectedMonthHolidayLabels[`${currentMonth.split("-")[1]}-${day}`]
                                return (
                                    <button
                                        key={`${idx}-${day}`}
                                        type="button"
                                        onClick={() => setSelectedDay(day)}
                                        className={[
                                            "flex flex-col rounded-lg border p-2 text-left text-xs",
                                            "min-h-[72px] sm:min-h-[80px]",
                                            "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            active
                                                ? "border-foreground bg-foreground text-background shadow-md"
                                                : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/30",
                                        ].join(" ")}
                                    >
                                        <span className={["font-bold text-sm leading-none", active ? "text-background" : "text-foreground"].join(" ")}>
                                            {parseInt(day, 10)}
                                        </span>
                                        {holidayLabel ? (
                                            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                {holidayLabel}
                                            </span>
                                        ) : null}
                                        {count > 0 ? (
                                            <span className={[
                                                "mt-auto inline-flex items-center justify-center rounded-full",
                                                "text-[10px] font-semibold px-1.5 py-0.5 self-start leading-none",
                                                active
                                                    ? "bg-background/20 text-background"
                                                    : "bg-destructive/15 text-destructive",
                                            ].join(" ")}>
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="mt-auto text-[10px] text-muted-foreground/30">—</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Day detail panel */}
                        <div className="mt-5 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
                                <span className="text-muted-foreground shrink-0"><IconCalendar /></span>
                                <p className="text-sm font-semibold text-foreground">
                                    {selectedDay ? `Incidencias — día ${parseInt(selectedDay, 10)}` : "Detalles del día"}
                                </p>
                            </div>

                            <div className="px-4 py-4 sm:px-5">
                                {!selectedDay ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Selecciona un día en el calendario.
                                    </p>
                                ) : (
                                    <>
                                        <div className="grid gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-3">
                                            {selectedDayAreaSummary.map((area) => {
                                                const active = selectedArea === area.area
                                                return (
                                                    <button
                                                        key={area.area}
                                                        type="button"
                                                        onClick={() => setSelectedArea(area.area)}
                                                        className={[
                                                            "text-left rounded-2xl border p-4 transition-all",
                                                            "bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                            active
                                                                ? "border-foreground bg-foreground/10"
                                                                : "border-border hover:border-foreground/40 hover:bg-muted/50",
                                                        ].join(" ")}
                                                    >
                                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                                            {area.area}
                                                        </p>
                                                        <div className="mt-3 grid gap-2 text-sm text-foreground">
                                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                                <span>Autorizado</span>
                                                                <span className="font-semibold">{area.personal_autorizado}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                                <span>Activo</span>
                                                                <span className="font-semibold">{area.personal_activo}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                                <span>Incidencias</span>
                                                                <span className="font-semibold">{area.personal_incidencia}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                                                <span>Personal real</span>
                                                                <span className="font-semibold">{area.personal_real}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {selectedArea ? (
                                            <div className="mb-4 rounded-2xl border border-border bg-background p-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-foreground">Detalle de {selectedArea}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedArea("")}
                                                        className="rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:border-foreground/50 hover:text-foreground"
                                                    >
                                                        Limpiar
                                                    </button>
                                                </div>

                                                {selectedAreaDetailRows.length > 0 ? (
                                                    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                                                        <table className="min-w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-border bg-muted/50 text-left">
                                                                    {['# Empleado', 'Empleado', 'Tipo de incidencia'].map((h) => (
                                                                        <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                                            {h}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border bg-card">
                                                                {selectedAreaDetailRows.map((row, i) => (
                                                                    <tr key={row.key} className={i % 2 !== 0 ? 'bg-muted/20' : ''}>
                                                                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{row.numero_empleado}</td>
                                                                        <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.nombre}</td>
                                                                        <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">{row.tipo_incidencia}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                                                        Sin incidencias registradas para esta área en el día seleccionado.
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        <Tabs value={selectedIncidentTab} onValueChange={(v) => setSelectedIncidentTab(v as IncidentTab)}>
                                            {/* Tabs */}
                                            <TabsList className="flex flex-wrap gap-1.5 h-auto bg-transparent p-0 mb-4">
                                                {INCIDENT_TABS.map((code) => {
                                                    const cnt = selectedDayCounts[code] ?? 0
                                                    const active = selectedIncidentTab === code
                                                    return (
                                                        <TabsTrigger
                                                            key={code}
                                                            value={code}
                                                            className={[
                                                                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                                                                "transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                                                "data-[state=active]:shadow-none", // neutraliza shadcn
                                                                active
                                                                    ? "!border-primary !text-primary !bg-background !shadow-none ring-1 ring-primary/20"
                                                                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                                            ].join(" ")}
                                                        >
                                                            {INCIDENCIA_LABELS[code] ?? code}
                                                            <span className={[
                                                                "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
                                                                active
                                                                    ? "bg-primary/10 text-primary"
                                                                    : cnt > 0
                                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                                                        : "bg-muted text-muted-foreground/50",
                                                            ].join(" ")}>
                                                                {cnt}
                                                            </span>
                                                        </TabsTrigger>
                                                    )
                                                })}
                                            </TabsList>

                                            {/* Tab content */}
                                            {INCIDENT_TABS.map((code) => (
                                                <TabsContent key={code} value={code} className="mt-0 focus-visible:outline-none">
                                                    {selectedDayCounts[code] > 0 ? (
                                                        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                                                            <table className="min-w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-border bg-muted/50 text-left">
                                                                        {["Empleado", "# Empleado", "Departamento", "Área", "Turno"].map((h) => (
                                                                            <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                                                {h}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border bg-card">
                                                                    {selectedDayIncidentSummary[code].map((row, i) => (
                                                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                                                            <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.nombre}</td>
                                                                            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.numero_empleado}</td>
                                                                            <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">{row.departamento}</td>
                                                                            <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">{row.area}</td>
                                                                            <td className="px-4 py-2.5">
                                                                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                                                    {row.turno}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background py-10 text-center">
                                                            <span className="mb-2 text-muted-foreground/30"><IconEmpty /></span>
                                                            <p className="text-sm text-muted-foreground">Sin registros para este criterio.</p>
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {!fileName && rows.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
                    <span className="mb-3 text-muted-foreground/30"><IconFile /></span>
                    <p className="text-sm font-medium text-muted-foreground">Carga un archivo JSON para comenzar.</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">El archivo debe seguir el formato de reporte diario.</p>
                </div>
            )}

            {/* ── Errors ───────────────────────────────────────────────── */}
            {errors.length > 0 && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-destructive shrink-0"><IconAlert /></span>
                        <h3 className="text-sm font-semibold text-destructive">Errores de formato</h3>
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