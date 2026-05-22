"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Users,
    AlertOctagon,
    TrendingDown,
    Search,
    Filter,
    Loader2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    UserX,
    BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { INCIDENCIA_LABELS, INCIDENT_TABS } from "./constants"
import { useReporteDiario } from "@/lib/hooks/useReporteDiario"
import {
    type AusentismoAggregate,
    type EmployeePeriodStats,
    type PeriodPreset,
    type ResolvedPeriod,
    type EmployeeSortField,
    aggregatePeriod,
    codeTone,
    formatLongDate,
    formatShortDate,
    parseRecordsByMes,
    resolvePeriod,
    sortEmployees,
} from "./ausentismo-helpers"

const PERIOD_PRESETS: { value: PeriodPreset; label: string; short: string }[] = [
    { value: "yesterday", label: "Ayer", short: "Ayer" },
    { value: "last3", label: "Últimos 3 días", short: "3 días" },
    { value: "last7", label: "Últimos 7 días", short: "7 días" },
    { value: "last15", label: "Últimos 15 días", short: "15 días" },
    { value: "last30", label: "Últimos 30 días", short: "30 días" },
    { value: "thisMonth", label: "Mes actual", short: "Mes" },
    { value: "lastMonth", label: "Mes anterior", short: "Mes anterior" },
    { value: "custom", label: "Personalizado", short: "Personalizado" },
]

function isoDateInputToday(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export default function AusentismoSection() {
    const { fetchByMesList, loading } = useReporteDiario()

    const [preset, setPreset] = useState<PeriodPreset>("last7")
    const [customFrom, setCustomFrom] = useState<string>(isoDateInputToday())
    const [customTo, setCustomTo] = useState<string>(isoDateInputToday())

    const [search, setSearch] = useState("")
    const [departamentoFilter, setDepartamentoFilter] = useState<string>("")
    const [areaFilter, setAreaFilter] = useState<string>("")
    const [turnoFilter, setTurnoFilter] = useState<string>("")
    const [codeFilter, setCodeFilter] = useState<string>("")

    const [rawData, setRawData] = useState<{ mes: string; data: unknown }[]>([])
    const [missingMonths, setMissingMonths] = useState<string[]>([])
    const [fetchError, setFetchError] = useState<string | null>(null)

    const [sortField, setSortField] = useState<EmployeeSortField>("ausentismo")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 25
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
    const [empDetail, setEmpDetail] = useState<EmployeePeriodStats | null>(null)

    const period: ResolvedPeriod = useMemo(
        () => resolvePeriod(preset, customFrom, customTo),
        [preset, customFrom, customTo],
    )

    // Fetch the required months whenever the period changes
    useEffect(() => {
        let canceled = false
        async function load() {
            setFetchError(null)
            if (period.mesList.length === 0) {
                setRawData([])
                setMissingMonths([])
                return
            }
            const records = await fetchByMesList(period.mesList)
            if (canceled) return
            const present = new Set(records.map((r) => r.mes))
            const missing = period.mesList.filter((m) => !present.has(m))
            setMissingMonths(missing)
            setRawData(records.map((r) => ({ mes: r.mes, data: r.data })))
        }
        load().catch((err) => {
            if (!canceled) setFetchError(err instanceof Error ? err.message : String(err))
        })
        return () => {
            canceled = true
        }
    }, [period.mesList, fetchByMesList])

    const rowsByMes = useMemo(() => parseRecordsByMes(rawData), [rawData])

    const availableDepartments = useMemo(() => {
        const set = new Set<string>()
        for (const rows of rowsByMes.values()) {
            for (const r of rows) if (r.departamento) set.add(r.departamento)
        }
        return Array.from(set).sort()
    }, [rowsByMes])
    const availableAreas = useMemo(() => {
        const set = new Set<string>()
        for (const rows of rowsByMes.values()) {
            for (const r of rows) if (r.area) set.add(r.area)
        }
        return Array.from(set).sort()
    }, [rowsByMes])
    const availableTurnos = useMemo(() => {
        const set = new Set<string>()
        for (const rows of rowsByMes.values()) {
            for (const r of rows) if (r.turno) set.add(r.turno)
        }
        return Array.from(set).sort()
    }, [rowsByMes])

    const aggregate: AusentismoAggregate = useMemo(
        () => aggregatePeriod(rowsByMes, period, {
            search,
            departamento: departamentoFilter || undefined,
            area: areaFilter || undefined,
            turno: turnoFilter || undefined,
            codeFilter: codeFilter || undefined,
        }),
        [rowsByMes, period, search, departamentoFilter, areaFilter, turnoFilter, codeFilter],
    )

    const sortedEmployees = useMemo(
        () => sortEmployees(aggregate.employees, sortField, sortDir),
        [aggregate.employees, sortField, sortDir],
    )
    const pageCount = Math.max(1, Math.ceil(sortedEmployees.length / PAGE_SIZE))
    const safePage = Math.min(page, pageCount)
    const pagedEmployees = useMemo(
        () => sortedEmployees.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
        [sortedEmployees, safePage],
    )

    useEffect(() => { setPage(1) }, [preset, customFrom, customTo, search, departamentoFilter, areaFilter, turnoFilter, codeFilter, sortField, sortDir])

    const handleSort = useCallback((field: EmployeeSortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortDir(field === "nombre" || field === "departamento" ? "asc" : "desc")
        }
    }, [sortField])

    const toggleDay = useCallback((iso: string) => {
        setExpandedDays((prev) => {
            const next = new Set(prev)
            if (next.has(iso)) next.delete(iso); else next.add(iso)
            return next
        })
    }, [])

    const periodLabel = period.label
    const periodRange = `${formatLongDate(period.days[0]?.iso ?? "")} → ${formatLongDate(period.days[period.days.length - 1]?.iso ?? "")}`

    const totalEmployeesInRange = useMemo(() => {
        const set = new Set<string>()
        for (const rows of rowsByMes.values()) {
            for (const r of rows) set.add(r.numero_empleado || r.nombre)
        }
        return set.size
    }, [rowsByMes])

    return (
        <div className="flex flex-col gap-5 max-w-full mx-auto pb-12">
            {/* ── Back link to reporte-diario ───────────────────────── */}
            <Link
                href="/reporte-diario"
                className="flex items-center justify-between rounded-xl border border-border bg-card shadow-sm p-4 transition hover:border-primary/40 hover:bg-muted/30 group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                        <ArrowLeft className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Volver al Reporte Diario</p>
                        <p className="text-xs text-muted-foreground">Cargar reporte, calendario y resumen mensual</p>
                    </div>
                </div>
            </Link>

            {/* ── Period selector ───────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">Periodo de análisis</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal">
                            {periodLabel}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{periodRange}</p>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                        {PERIOD_PRESETS.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPreset(p.value)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                                    preset === p.value
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {preset === "custom" && (
                        <div className="flex flex-wrap gap-3 items-end">
                            <label className="flex flex-col gap-1 text-xs">
                                <span className="text-muted-foreground">Desde</span>
                                <Input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="h-9 w-44"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs">
                                <span className="text-muted-foreground">Hasta</span>
                                <Input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="h-9 w-44"
                                />
                            </label>
                        </div>
                    )}
                    {missingMonths.length > 0 && (
                        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Sin datos cargados para {missingMonths.join(", ")}. Sube el reporte mensual en{" "}
                                <Link href="/reporte-diario" className="underline font-medium">Reporte Diario</Link>.
                            </span>
                        </div>
                    )}
                    {fetchError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{fetchError}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Filters ───────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">Filtros</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <label className="flex flex-col gap-1 text-xs lg:col-span-2">
                        <span className="text-muted-foreground">Buscar empleado</span>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre, número, puesto…"
                                className="h-9 pl-7"
                            />
                        </div>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        <span className="text-muted-foreground">Departamento</span>
                        <Select value={departamentoFilter || "__all"} onValueChange={(v) => setDepartamentoFilter(v === "__all" ? "" : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">Todos</SelectItem>
                                {availableDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        <span className="text-muted-foreground">Área</span>
                        <Select value={areaFilter || "__all"} onValueChange={(v) => setAreaFilter(v === "__all" ? "" : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">Todas</SelectItem>
                                {availableAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        <span className="text-muted-foreground">Turno</span>
                        <Select value={turnoFilter || "__all"} onValueChange={(v) => setTurnoFilter(v === "__all" ? "" : v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">Todos</SelectItem>
                                {availableTurnos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </label>
                </CardContent>
            </Card>

            {/* ── KPI cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    icon={<UserX className="w-4 h-4 text-destructive" />}
                    label="Faltas (F)"
                    value={aggregate.totals.byCode["F"] || 0}
                    sub={`Empleados: ${countWithCode(aggregate.employees, "F")}`}
                    tone="destructive"
                />
                <KpiCard
                    icon={<AlertOctagon className="w-4 h-4 text-warning" />}
                    label="Total incidencias"
                    value={aggregate.totals.incidencias}
                    sub={`${aggregate.totals.empleadosAfectados} empleado(s) afectados`}
                    tone="warning"
                />
                <KpiCard
                    icon={<Users className="w-4 h-4 text-info" />}
                    label="Personal observado"
                    value={totalEmployeesInRange}
                    sub={`Días observados: ${aggregate.totals.tracked}`}
                    tone="info"
                />
                <KpiCard
                    icon={<TrendingDown className="w-4 h-4 text-destructive" />}
                    label="% Ausentismo periodo"
                    value={`${aggregate.totals.pctAusentismo.toFixed(2)}%`}
                    sub={`Ausentismo (F+P+I): ${aggregate.totals.ausentismo}`}
                    tone="destructive"
                />
            </div>

            {/* ── Incident type tabs ───────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">Por tipo de incidencia</CardTitle>
                        </div>
                        {codeFilter && (
                            <Button variant="ghost" size="sm" onClick={() => setCodeFilter("")}>
                                Limpiar filtro
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Selecciona un tipo para filtrar el ranking de empleados.
                    </p>
                </CardHeader>
                <CardContent className="pt-0">
                    <Tabs value={codeFilter || "__all"} onValueChange={(v) => setCodeFilter(v === "__all" ? "" : v)}>
                        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40">
                            <TabsTrigger
                                value="__all"
                                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                Todas <span className="ml-1.5 text-[10px] opacity-70">({aggregate.totals.incidencias})</span>
                            </TabsTrigger>
                            {INCIDENT_TABS.map((code) => {
                                const count = aggregate.totals.byCode[code] || 0
                                return (
                                    <TabsTrigger
                                        key={code}
                                        value={code}
                                        className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                    >
                                        <span className="font-mono">{code}</span>
                                        <span className="ml-1 text-[10px] opacity-70">({count})</span>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ── Top ranking table ────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">Ranking de empleados</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {sortedEmployees.length} empleado(s) {codeFilter ? `con código ${codeFilter}` : "con datos en el periodo"}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-0 sm:px-6 overflow-x-auto">
                    {loading && rawData.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando datos...
                        </div>
                    ) : sortedEmployees.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            Sin incidencias para los filtros seleccionados.
                        </div>
                    ) : (
                        <table className="w-full min-w-[860px] text-sm border-separate border-spacing-0">
                            <thead className="bg-muted/40">
                                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <SortableTh field="nombre" current={sortField} dir={sortDir} onClick={handleSort}>Empleado</SortableTh>
                                    <SortableTh field="departamento" current={sortField} dir={sortDir} onClick={handleSort}>Depto / Área</SortableTh>
                                    <SortableTh field="ausentismo" current={sortField} dir={sortDir} onClick={handleSort} align="right">Ausent. F+P+I</SortableTh>
                                    <SortableTh field="F" current={sortField} dir={sortDir} onClick={handleSort} align="right">F</SortableTh>
                                    <SortableTh field="FJ" current={sortField} dir={sortDir} onClick={handleSort} align="right">FJ</SortableTh>
                                    <SortableTh field="P" current={sortField} dir={sortDir} onClick={handleSort} align="right">P</SortableTh>
                                    <SortableTh field="I" current={sortField} dir={sortDir} onClick={handleSort} align="right">I</SortableTh>
                                    <SortableTh field="S" current={sortField} dir={sortDir} onClick={handleSort} align="right">S</SortableTh>
                                    <SortableTh field="incidencias" current={sortField} dir={sortDir} onClick={handleSort} align="right">Total inc.</SortableTh>
                                    <SortableTh field="pctAusentismo" current={sortField} dir={sortDir} onClick={handleSort} align="right">% Aus.</SortableTh>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedEmployees.map((e, i) => (
                                    <tr
                                        key={e.key}
                                        onClick={() => setEmpDetail(e)}
                                        className={cn(
                                            "cursor-pointer transition hover:bg-muted/30 border-b border-border/50",
                                            i % 2 === 0 ? "bg-card" : "bg-muted/10",
                                        )}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="font-medium text-foreground leading-tight">{e.nombre}</div>
                                            <div className="text-[11px] text-muted-foreground font-mono">#{e.numero_empleado}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-xs text-foreground leading-tight">{e.departamento}</div>
                                            <div className="text-[11px] text-muted-foreground">{e.area} {e.turno && `· ${e.turno}`}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-destructive">{e.ausentismo}</td>
                                        <CodeCell value={e.byCode["F"] || 0} code="F" />
                                        <CodeCell value={e.byCode["FJ"] || 0} code="FJ" />
                                        <CodeCell value={e.byCode["P"] || 0} code="P" />
                                        <CodeCell value={e.byCode["I"] || 0} code="I" />
                                        <CodeCell value={e.byCode["S"] || 0} code="S" />
                                        <td className="px-3 py-2 text-right font-semibold">{e.incidencias}</td>
                                        <td className="px-3 py-2 text-right">
                                            <Badge
                                                variant={e.pctAusentismo >= 20 ? "error" : e.pctAusentismo >= 10 ? "warning" : "outline"}
                                                size="sm"
                                            >
                                                {e.pctAusentismo.toFixed(1)}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {pageCount > 1 && (
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                                Página {safePage} de {pageCount} · {sortedEmployees.length} empleados
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safePage >= pageCount}
                                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Daily chronology ─────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">Cronología diaria</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Quién faltó cada día del periodo (más reciente primero).
                    </p>
                </CardHeader>
                <CardContent className="pt-0 px-3 sm:px-6">
                    {aggregate.days.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            Sin días en el periodo.
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {aggregate.days.map((d) => {
                                const expanded = expandedDays.has(d.iso)
                                const ausentismoPct = d.tracked > 0
                                    ? Math.round((d.ausentismo / d.tracked) * 10000) / 100
                                    : 0
                                return (
                                    <li
                                        key={d.iso}
                                        className="rounded-lg border border-border bg-card overflow-hidden"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleDay(d.iso)}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/30 transition text-left"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex flex-col items-center justify-center w-12 shrink-0 rounded-md bg-muted/50 py-1">
                                                    <span className="text-[10px] uppercase text-muted-foreground">{["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.weekday]}</span>
                                                    <span className="text-base font-semibold leading-tight">{d.iso.slice(8, 10)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{formatLongDate(d.iso)}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {d.tracked} observados · {d.asistencias} A · {d.descansos} D · {d.incidencias} incid.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge
                                                    variant={d.ausentismo === 0 ? "outline" : ausentismoPct >= 10 ? "error" : "warning"}
                                                    size="sm"
                                                >
                                                    {d.ausentismo} ausentes · {ausentismoPct.toFixed(1)}%
                                                </Badge>
                                                {expanded
                                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                        </button>
                                        {expanded && (
                                            <div className="border-t border-border px-3 py-2 bg-muted/10">
                                                {d.absentees.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground py-1">Sin ausentes (F/P/I) este día.</p>
                                                ) : (
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                        {d.absentees.map((a) => (
                                                            <li
                                                                key={`${d.iso}-${a.key}`}
                                                                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2 py-1.5 text-xs"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-medium truncate">{a.nombre}</div>
                                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                                        #{a.numero_empleado} · {a.area}{a.turno ? ` · ${a.turno}` : ""}
                                                                    </div>
                                                                </div>
                                                                <CodeChip code={a.code} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* ── Employee detail modal ────────────────────────────── */}
            <EmployeeDetailDialog
                employee={empDetail}
                period={period}
                onClose={() => setEmpDetail(null)}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Small subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
    icon,
    label,
    value,
    sub,
    tone,
}: {
    icon: React.ReactNode
    label: string
    value: string | number
    sub?: string
    tone: "destructive" | "warning" | "info" | "success"
}) {
    const toneCls = {
        destructive: "border-destructive/30 bg-destructive/5",
        warning: "border-warning/30 bg-warning/5",
        info: "border-info/30 bg-info/5",
        success: "border-success/30 bg-success/5",
    }[tone]
    return (
        <div className={cn("rounded-xl border bg-card shadow-sm p-3 flex flex-col gap-1", toneCls)}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <div className="text-2xl font-semibold leading-tight">{value}</div>
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
    )
}

function SortableTh({
    field,
    current,
    dir,
    onClick,
    align = "left",
    children,
}: {
    field: EmployeeSortField
    current: EmployeeSortField
    dir: "asc" | "desc"
    onClick: (f: EmployeeSortField) => void
    align?: "left" | "right"
    children: React.ReactNode
}) {
    const active = current === field
    return (
        <th
            className={cn(
                "px-3 py-2 cursor-pointer select-none font-medium border-b border-border",
                align === "right" ? "text-right" : "text-left",
            )}
            onClick={() => onClick(field)}
        >
            <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end w-full")}>
                {children}
                {active && (dir === "asc"
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />)}
            </span>
        </th>
    )
}

function CodeCell({ value, code }: { value: number; code: string }) {
    if (value === 0) return <td className="px-3 py-2 text-right text-muted-foreground">—</td>
    const tone = codeTone(code)
    return (
        <td className="px-3 py-2 text-right">
            <span className={cn("inline-flex items-center justify-center min-w-[1.75rem] rounded-md px-1.5 py-0.5 text-xs font-semibold", tone.text, tone.bg)}>
                {value}
            </span>
        </td>
    )
}

function CodeChip({ code }: { code: string }) {
    const tone = codeTone(code)
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold font-mono ring-1",
                tone.text, tone.bg, tone.ring,
            )}
            title={INCIDENCIA_LABELS[code] ?? code}
        >
            {code}
        </span>
    )
}

function countWithCode(employees: EmployeePeriodStats[], code: string): number {
    return employees.reduce((n, e) => n + ((e.byCode[code] || 0) > 0 ? 1 : 0), 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee detail dialog
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeDetailDialog({
    employee,
    period,
    onClose,
}: {
    employee: EmployeePeriodStats | null
    period: ResolvedPeriod
    onClose: () => void
}) {
    const open = !!employee
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card">
                {employee && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">#{employee.numero_empleado}</span>
                                <span>{employee.nombre}</span>
                            </DialogTitle>
                            <DialogDescription>
                                {employee.departamento} · {employee.area}{employee.turno ? ` · ${employee.turno}` : ""}
                                {employee.puesto && ` · ${employee.puesto}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <MiniStat label="Días observados" value={employee.tracked} />
                            <MiniStat label="Asistencias" value={employee.asistencias} tone="success" />
                            <MiniStat label="Incidencias" value={employee.incidencias} tone="warning" />
                            <MiniStat label="Ausent. F+P+I" value={`${employee.ausentismo} (${employee.pctAusentismo.toFixed(1)}%)`} tone="destructive" />
                        </div>

                        {Object.keys(employee.byCode).length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs uppercase text-muted-foreground mb-1.5 tracking-wide">Desglose por código</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(employee.byCode)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([code, count]) => (
                                            <span
                                                key={code}
                                                className={cn(
                                                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                                                    codeTone(code).bg,
                                                    codeTone(code).text,
                                                )}
                                                title={INCIDENCIA_LABELS[code] ?? code}
                                            >
                                                <span className="font-mono font-semibold">{code}</span>
                                                <span className="font-semibold">{count}</span>
                                                <span className="text-[10px] opacity-70 hidden sm:inline">
                                                    {INCIDENCIA_LABELS[code] ?? ""}
                                                </span>
                                            </span>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <p className="text-xs uppercase text-muted-foreground mb-1.5 tracking-wide">Cronología en el periodo</p>
                            {employee.incidents.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Sin incidencias en este periodo.</p>
                            ) : (
                                <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                                    {employee.incidents.map((inc) => (
                                        <li
                                            key={`${inc.iso}-${inc.code}`}
                                            className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs"
                                        >
                                            <span>{formatShortDate(inc.iso)} <span className="text-muted-foreground">— {INCIDENCIA_LABELS[inc.code] ?? inc.code}</span></span>
                                            <CodeChip code={inc.code} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Periodo: {period.label}</span>
                            <Link href="/reporte-diario" className="text-primary inline-flex items-center gap-1 hover:underline">
                                Ver reporte completo <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function MiniStat({
    label,
    value,
    tone = "default",
}: {
    label: string
    value: string | number
    tone?: "default" | "success" | "warning" | "destructive"
}) {
    const toneCls = {
        default: "border-border bg-muted/30",
        success: "border-success/30 bg-success/10",
        warning: "border-warning/30 bg-warning/10",
        destructive: "border-destructive/30 bg-destructive/10",
    }[tone]
    return (
        <div className={cn("rounded-lg border p-2.5", toneCls)}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-base font-semibold">{value}</div>
        </div>
    )
}
