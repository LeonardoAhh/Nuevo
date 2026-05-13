"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CalendarDays,
    CalendarX,
    Database,
    Loader2,
    MapPin,
    Search,
    TrendingDown,
    UserMinus,
    Users,
} from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { INCIDENT_TABS } from "./constants"
import type { IncidentTab, ReporteRow } from "./types"
import { parseReporteJSON } from "./helpers"
import {
    type EmployeeRanking,
    type FiltroPeriodo,
    type GroupRanking,
    type IncidenciaEvento,
    INCIDENT_TAB_COLORS,
    aplicarFiltro,
    compareIso,
    computeStats,
    formatIsoCorto,
    formatIsoLargo,
    isoToday,
    rankEmpleados,
    rankGroup,
    rowsToEventos,
    shiftIsoDays,
    tipoLabel,
} from "./ausentismo-helpers"
import { useReporteDiario } from "@/lib/hooks/useReporteDiario"

// ─────────────────────────────────────────────────────────────────────────────
// Periodos
// ─────────────────────────────────────────────────────────────────────────────

type PeriodoKey =
    | "ayer"
    | "hoy"
    | "ult3"
    | "ult7"
    | "ult14"
    | "ult30"
    | "mes_actual"
    | "mes_anterior"
    | "todo"

const PERIODO_OPTIONS: { value: PeriodoKey; label: string; sub?: string }[] = [
    { value: "ayer", label: "Ayer" },
    { value: "hoy", label: "Hoy" },
    { value: "ult3", label: "Últimos 3 días" },
    { value: "ult7", label: "Últimos 7 días" },
    { value: "ult14", label: "Últimos 14 días" },
    { value: "ult30", label: "Últimos 30 días" },
    { value: "mes_actual", label: "Mes actual" },
    { value: "mes_anterior", label: "Mes anterior" },
    { value: "todo", label: "Todo el historial" },
]

interface Rango {
    desde: string
    hasta: string
}

function resolvePeriodo(periodo: PeriodoKey, eventos: IncidenciaEvento[]): Rango {
    const today = isoToday()
    const yesterday = shiftIsoDays(today, -1)

    if (periodo === "hoy") return { desde: today, hasta: today }
    if (periodo === "ayer") return { desde: yesterday, hasta: yesterday }
    if (periodo === "ult3") return { desde: shiftIsoDays(today, -2), hasta: today }
    if (periodo === "ult7") return { desde: shiftIsoDays(today, -6), hasta: today }
    if (periodo === "ult14") return { desde: shiftIsoDays(today, -13), hasta: today }
    if (periodo === "ult30") return { desde: shiftIsoDays(today, -29), hasta: today }

    if (periodo === "mes_actual") {
        const [y, m] = today.split("-").map(Number)
        const last = new Date(y, m, 0).getDate()
        return {
            desde: `${y}-${String(m).padStart(2, "0")}-01`,
            hasta: `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
        }
    }

    if (periodo === "mes_anterior") {
        const [y, m] = today.split("-").map(Number)
        const prevDate = new Date(y, m - 2, 1)
        const py = prevDate.getFullYear()
        const pm = prevDate.getMonth() + 1
        const last = new Date(py, pm, 0).getDate()
        return {
            desde: `${py}-${String(pm).padStart(2, "0")}-01`,
            hasta: `${py}-${String(pm).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
        }
    }

    // todo el historial → desde el evento más antiguo al más reciente
    if (eventos.length === 0) return { desde: today, hasta: today }
    const ordenados = eventos.map((e) => e.fecha).sort(compareIso)
    return { desde: ordenados[0], hasta: ordenados[ordenados.length - 1] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

const ALL = "__all__"

export default function AusentismoSection() {
    const { fetchSummaries, fetchByMes } = useReporteDiario()

    const [meses, setMeses] = useState<string[]>([])
    const [rowsByMes, setRowsByMes] = useState<Record<string, ReporteRow[]>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [periodo, setPeriodo] = useState<PeriodoKey>("ult7")
    const [tipo, setTipo] = useState<IncidentTab | "TODOS">("TODOS")
    const [departamento, setDepartamento] = useState("")
    const [area, setArea] = useState("")
    const [turno, setTurno] = useState("")
    const [busqueda, setBusqueda] = useState("")

    // Carga inicial: lista de meses guardados, luego fetch de cada uno
    useEffect(() => {
        let cancelado = false
        async function init() {
            try {
                const summaries = await fetchSummaries()
                if (cancelado) return
                const ordenado = summaries
                    .map((s) => s.mes)
                    .sort((a, b) => b.localeCompare(a))
                setMeses(ordenado)

                if (ordenado.length === 0) {
                    setLoading(false)
                    return
                }

                const records = await Promise.all(ordenado.map((mes) => fetchByMes(mes)))
                if (cancelado) return

                const map: Record<string, ReporteRow[]> = {}
                for (const rec of records) {
                    if (!rec) continue
                    const { rows } = parseReporteJSON(rec.data as unknown[])
                    map[rec.mes] = rows
                }
                setRowsByMes(map)
            } catch (err) {
                if (!cancelado) {
                    setError(err instanceof Error ? err.message : "Error cargando reportes")
                }
            } finally {
                if (!cancelado) setLoading(false)
            }
        }
        init()
        return () => { cancelado = true }
    }, [fetchSummaries, fetchByMes])

    // ── Derivados base ──
    const allRows = useMemo(
        () => Object.values(rowsByMes).flat(),
        [rowsByMes],
    )

    const eventos = useMemo(() => rowsToEventos(allRows), [allRows])

    const departamentos = useMemo(
        () => Array.from(new Set(allRows.map((r) => r.departamento).filter(Boolean))).sort(),
        [allRows],
    )
    const areas = useMemo(
        () => Array.from(new Set(allRows.map((r) => r.area).filter(Boolean))).sort(),
        [allRows],
    )
    const turnos = useMemo(
        () => Array.from(new Set(allRows.map((r) => r.turno).filter((t): t is string => !!t))).sort(),
        [allRows],
    )

    const rango = useMemo(() => resolvePeriodo(periodo, eventos), [periodo, eventos])

    const filtro = useMemo<FiltroPeriodo>(() => ({
        desde: rango.desde,
        hasta: rango.hasta,
        departamento: departamento || undefined,
        area: area || undefined,
        turno: turno || undefined,
        tipo,
        busqueda,
    }), [rango, departamento, area, turno, tipo, busqueda])

    const eventosFiltrados = useMemo(
        () => aplicarFiltro(eventos, filtro),
        [eventos, filtro],
    )

    const stats = useMemo(() => computeStats(eventosFiltrados), [eventosFiltrados])
    const rankingEmpleados = useMemo(() => rankEmpleados(eventosFiltrados), [eventosFiltrados])
    const rankingAreas = useMemo(() => rankGroup(eventosFiltrados, "area"), [eventosFiltrados])
    const rankingDeptos = useMemo(() => rankGroup(eventosFiltrados, "departamento"), [eventosFiltrados])
    const rankingTurnos = useMemo(() => rankGroup(eventosFiltrados, "turno"), [eventosFiltrados])

    // "Faltó ayer" — independiente del filtro de período (siempre fijo a ayer)
    const eventosAyer = useMemo(() => {
        const ayer = shiftIsoDays(isoToday(), -1)
        return aplicarFiltro(eventos, {
            desde: ayer,
            hasta: ayer,
            departamento: departamento || undefined,
            area: area || undefined,
            turno: turno || undefined,
            tipo: "TODOS",
            busqueda: "",
        })
    }, [eventos, departamento, area, turno])

    const limpiarFiltros = useCallback(() => {
        setDepartamento("")
        setArea("")
        setTurno("")
        setBusqueda("")
        setTipo("TODOS")
    }, [])

    return (
        <div className="flex flex-col gap-5 max-w-full mx-auto pb-12">
            {/* ── Header: volver a Reporte Diario ──────────────────────── */}
            <Link
                href="/reporte-diario"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Reporte Diario
            </Link>

            {/* ── Banner / loading ─────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Cargando reportes guardados…</span>
                </div>
            )}

            {!loading && error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && meses.length === 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-card p-5 text-sm text-muted-foreground">
                    <Database className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
                    <div>
                        <p className="font-medium text-foreground">No hay reportes guardados</p>
                        <p className="mt-0.5">
                            Sube y guarda al menos un reporte en{" "}
                            <Link href="/reporte-diario" className="underline">/reporte-diario</Link>{" "}
                            para ver el análisis de ausentismo.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && meses.length > 0 && (
                <>
                    {/* ── Toolbar: período + filtros ───────────────────── */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border bg-muted/40 px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">Análisis de ausentismo</span>
                                <span className="text-xs text-muted-foreground">
                                    {meses.length} {meses.length === 1 ? "mes" : "meses"} cargados ·{" "}
                                    {eventos.length} incidencias totales
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <FieldSelect
                                label="Período"
                                value={periodo}
                                onChange={(v) => setPeriodo(v as PeriodoKey)}
                                options={PERIODO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                            />
                            <FieldSelect
                                label="Tipo de incidencia"
                                value={tipo}
                                onChange={(v) => setTipo(v as IncidentTab | "TODOS")}
                                options={[
                                    { value: "TODOS", label: "Todos" },
                                    ...INCIDENT_TABS.map((code) => ({
                                        value: code,
                                        label: `${code} — ${tipoLabel(code)}`,
                                    })),
                                ]}
                            />
                            <FieldSelect
                                label="Departamento"
                                value={departamento || ALL}
                                onChange={(v) => setDepartamento(v === ALL ? "" : v)}
                                options={[
                                    { value: ALL, label: "Todos" },
                                    ...departamentos.map((d) => ({ value: d, label: d })),
                                ]}
                                disabled={!departamentos.length}
                            />
                            <FieldSelect
                                label="Área"
                                value={area || ALL}
                                onChange={(v) => setArea(v === ALL ? "" : v)}
                                options={[
                                    { value: ALL, label: "Todas" },
                                    ...areas.map((a) => ({ value: a, label: a })),
                                ]}
                                disabled={!areas.length}
                            />
                            <FieldSelect
                                label="Turno"
                                value={turno || ALL}
                                onChange={(v) => setTurno(v === ALL ? "" : v)}
                                options={[
                                    { value: ALL, label: "Todos" },
                                    ...turnos.map((t) => ({ value: t, label: `Turno ${t}` })),
                                ]}
                                disabled={!turnos.length}
                            />

                            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Buscar empleado
                                </span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        placeholder="Nombre, número, depto, área…"
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2 sm:justify-end">
                                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Rango analizado
                                </span>
                                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                                    <span className="font-medium text-foreground">
                                        {formatIsoCorto(rango.desde)} — {formatIsoCorto(rango.hasta)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={limpiarFiltros}
                                        className="text-muted-foreground hover:text-primary transition"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── KPIs ─────────────────────────────────────────── */}
                    <KpisRow stats={stats} rankingEmpleados={rankingEmpleados} rankingAreas={rankingAreas} />

                    {/* ── Faltó ayer (siempre visible) ──────────────────── */}
                    <FaltoAyerCard eventos={eventosAyer} />

                    {/* ── Tendencia diaria ──────────────────────────────── */}
                    <TendenciaCard
                        porFecha={stats.porFecha}
                        desde={rango.desde}
                        hasta={rango.hasta}
                    />

                    {/* ── Top empleados ─────────────────────────────────── */}
                    <RankingEmpleadosCard ranking={rankingEmpleados} totalPeriodo={stats.totalEventos} />

                    {/* ── Distribución por tipo + por área + por depto ──── */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <DistribucionTiposCard porTipo={stats.porTipo} total={stats.totalEventos} />
                        <RankingGruposCard
                            titulo="Áreas con más incidencias"
                            icono={<MapPin className="w-4 h-4 text-primary" />}
                            ranking={rankingAreas}
                        />
                        <RankingGruposCard
                            titulo="Departamentos con más incidencias"
                            icono={<Users className="w-4 h-4 text-primary" />}
                            ranking={rankingDeptos}
                        />
                        <RankingGruposCard
                            titulo="Turnos con más incidencias"
                            icono={<CalendarDays className="w-4 h-4 text-primary" />}
                            ranking={rankingTurnos}
                            prefix="Turno "
                        />
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────────────

function FieldSelect({
    label, value, onChange, options, disabled,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    disabled?: boolean
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className="rounded-lg">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

interface KpiCardData {
    label: string
    value: string | number
    sub?: string
    icon: React.ReactNode
    tone?: "default" | "warning" | "destructive" | "success"
}

function KpisRow({
    stats, rankingEmpleados, rankingAreas,
}: {
    stats: ReturnType<typeof computeStats>
    rankingEmpleados: EmployeeRanking[]
    rankingAreas: GroupRanking[]
}) {
    const peor = rankingEmpleados[0]
    const peorArea = rankingAreas[0]
    const pctAusentismo = stats.totalEventos > 0
        ? Math.round((stats.totalAusencias / Math.max(stats.totalEventos, 1)) * 100)
        : 0

    const cards: KpiCardData[] = [
        {
            label: "Incidencias en el período",
            value: stats.totalEventos,
            sub: `${stats.diasUnicos} ${stats.diasUnicos === 1 ? "día" : "días"} con eventos`,
            icon: <CalendarX className="w-5 h-5" />,
            tone: stats.totalEventos > 0 ? "warning" : "default",
        },
        {
            label: "Empleados con incidencias",
            value: stats.totalEmpleadosConIncidencia,
            sub: `de ${rankingEmpleados.length} en el período`,
            icon: <Users className="w-5 h-5" />,
        },
        {
            label: "Ausentismo (F+I+P)",
            value: stats.totalAusencias,
            sub: `${pctAusentismo}% del total de incidencias`,
            icon: <UserMinus className="w-5 h-5" />,
            tone: stats.totalAusencias > 0 ? "destructive" : "success",
        },
        {
            label: "Empleado con más incidencias",
            value: peor ? peor.nombre : "—",
            sub: peor ? `${peor.total} incidencias · ${peor.area}` : undefined,
            icon: <TrendingDown className="w-5 h-5" />,
            tone: peor && peor.total > 5 ? "destructive" : peor && peor.total > 2 ? "warning" : "default",
        },
        {
            label: "Área con más incidencias",
            value: peorArea ? peorArea.label : "—",
            sub: peorArea ? `${peorArea.total} eventos` : undefined,
            icon: <MapPin className="w-5 h-5" />,
            tone: peorArea && peorArea.total > 10 ? "destructive" : peorArea && peorArea.total > 0 ? "warning" : "default",
        },
    ]

    return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className={cn(
                        "rounded-xl border p-4 bg-card shadow-sm",
                        c.tone === "destructive" && "border-destructive/30",
                        c.tone === "warning" && "border-warning/30",
                        c.tone === "success" && "border-success/30",
                        (!c.tone || c.tone === "default") && "border-border",
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {c.label}
                        </span>
                        <span className={cn(
                            "text-muted-foreground/60",
                            c.tone === "destructive" && "text-destructive/70",
                            c.tone === "warning" && "text-warning/70",
                            c.tone === "success" && "text-success/70",
                        )}>
                            {c.icon}
                        </span>
                    </div>
                    <p className={cn(
                        "text-lg font-bold text-foreground truncate",
                        c.tone === "destructive" && "text-destructive",
                    )}>
                        {c.value}
                    </p>
                    {c.sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.sub}</p>}
                </div>
            ))}
        </div>
    )
}

function FaltoAyerCard({ eventos }: { eventos: IncidenciaEvento[] }) {
    const ayer = shiftIsoDays(isoToday(), -1)
    const ausentes = eventos.filter((e) => e.code === "F" || e.code === "I" || e.code === "P")
    const otros = eventos.filter((e) => e.code !== "F" && e.code !== "I" && e.code !== "P")

    return (
        <Card className={cn(
            "border shadow-sm",
            eventos.length === 0 ? "border-border" : "border-warning/40",
        )}>
            <CardHeader className="border-b border-border bg-muted/40 px-5 py-4 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className={cn("w-4 h-4", eventos.length === 0 ? "text-muted-foreground" : "text-warning")} />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Faltó ayer</p>
                        <p className="text-xs text-muted-foreground">{formatIsoLargo(ayer)}</p>
                    </div>
                </div>
                <Badge variant={eventos.length === 0 ? "secondary" : "destructive"}>
                    {eventos.length} {eventos.length === 1 ? "incidencia" : "incidencias"}
                </Badge>
            </CardHeader>
            <CardContent className="p-0">
                {eventos.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                        Sin registros de incidencias para ayer.
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {ausentes.length > 0 && (
                            <SeccionEmpleadosAyer titulo="Ausentes (F/I/P)" eventos={ausentes} tone="destructive" />
                        )}
                        {otros.length > 0 && (
                            <SeccionEmpleadosAyer titulo="Otras incidencias" eventos={otros} tone="warning" />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function SeccionEmpleadosAyer({
    titulo, eventos, tone,
}: {
    titulo: string
    eventos: IncidenciaEvento[]
    tone: "destructive" | "warning"
}) {
    return (
        <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {titulo} · {eventos.length}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {eventos
                    .slice()
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((e) => (
                        <div
                            key={`${e.numero_empleado}-${e.code}`}
                            className={cn(
                                "rounded-lg border bg-background px-3 py-2 flex items-center gap-3 text-sm",
                                tone === "destructive" ? "border-destructive/20" : "border-warning/20",
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-flex w-9 h-9 items-center justify-center rounded-full font-mono text-[11px] font-bold shrink-0",
                                    tone === "destructive"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-warning/10 text-warning-foreground",
                                )}
                            >
                                {e.code}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{e.nombre}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    #{e.numero_empleado} · {e.area || e.departamento || "—"}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

function TendenciaCard({
    porFecha, desde, hasta,
}: {
    porFecha: Record<string, number>
    desde: string
    hasta: string
}) {
    const data = useMemo(() => {
        const items: { fecha: string; corto: string; total: number }[] = []
        let cursor = desde
        let guard = 0
        while (cursor <= hasta && guard < 400) {
            items.push({
                fecha: cursor,
                corto: formatIsoCorto(cursor),
                total: porFecha[cursor] || 0,
            })
            cursor = shiftIsoDays(cursor, 1)
            guard++
        }
        return items
    }, [porFecha, desde, hasta])

    const total = data.reduce((n, d) => n + d.total, 0)

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 px-5 py-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Tendencia diaria</p>
                        <p className="text-xs text-muted-foreground">{total} incidencias en el período</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {data.length === 0 || total === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sin datos para el período seleccionado.
                    </p>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="corto"
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                    labelStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function RankingEmpleadosCard({
    ranking, totalPeriodo,
}: {
    ranking: EmployeeRanking[]
    totalPeriodo: number
}) {
    const [orden, setOrden] = useState<"total" | "F" | "I" | "P">("total")
    const [limite, setLimite] = useState<10 | 20 | 50>(20)

    const sorted = useMemo(() => {
        const copia = ranking.slice()
        copia.sort((a, b) => {
            if (orden === "total") return b.total - a.total
            return b.porTipo[orden] - a.porTipo[orden]
        })
        return copia.slice(0, limite)
    }, [ranking, orden, limite])

    const tabsValue: "total" | IncidentTab = orden

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 px-5 py-4 flex flex-row items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <UserMinus className="w-4 h-4 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Empleados con más incidencias</p>
                        <p className="text-xs text-muted-foreground">
                            {ranking.length} empleados · {totalPeriodo} eventos
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Tabs value={tabsValue} onValueChange={(v) => setOrden(v as typeof orden)}>
                        <TabsList className="h-8">
                            <TabsTrigger value="total" className="text-xs px-2.5 py-1">Total</TabsTrigger>
                            <TabsTrigger value="F" className="text-xs px-2.5 py-1">Faltas (F)</TabsTrigger>
                            <TabsTrigger value="I" className="text-xs px-2.5 py-1">Incap. (I)</TabsTrigger>
                            <TabsTrigger value="P" className="text-xs px-2.5 py-1">Permisos (P)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Select value={String(limite)} onValueChange={(v) => setLimite(Number(v) as 10 | 20 | 50)}>
                        <SelectTrigger className="h-8 w-[110px] text-xs rounded-lg">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">Top 10</SelectItem>
                            <SelectItem value="20">Top 20</SelectItem>
                            <SelectItem value="50">Top 50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {sorted.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                        Sin empleados con incidencias en el período actual.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10 text-center">#</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Depto / Área</TableHead>
                                    <TableHead className="text-center">Turno</TableHead>
                                    <TableHead className="text-right">F</TableHead>
                                    <TableHead className="text-right">FJ</TableHead>
                                    <TableHead className="text-right">I</TableHead>
                                    <TableHead className="text-right">P</TableHead>
                                    <TableHead className="text-right">Otros</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((r, idx) => {
                                    const otros = r.total - r.porTipo.F - r.porTipo.FJ - r.porTipo.I - r.porTipo.P
                                    return (
                                        <TableRow key={r.numero_empleado}>
                                            <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{r.nombre}</span>
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        #{r.numero_empleado}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="text-foreground truncate max-w-[220px]">{r.departamento}</span>
                                                    <span className="text-muted-foreground truncate max-w-[220px]">{r.area}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-xs">
                                                {r.turno !== "-" ? <Badge variant="outline">{r.turno}</Badge> : "—"}
                                            </TableCell>
                                            <CountCell value={r.porTipo.F} tone="destructive" />
                                            <CountCell value={r.porTipo.FJ} />
                                            <CountCell value={r.porTipo.I} tone="destructive" />
                                            <CountCell value={r.porTipo.P} />
                                            <CountCell value={otros} />
                                            <TableCell className="text-right font-bold text-foreground">
                                                {r.total}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function CountCell({ value, tone }: { value: number; tone?: "destructive" }) {
    return (
        <TableCell className={cn(
            "text-right tabular-nums text-sm",
            value === 0 && "text-muted-foreground/50",
            tone === "destructive" && value > 0 && "text-destructive font-semibold",
        )}>
            {value}
        </TableCell>
    )
}

function DistribucionTiposCard({
    porTipo, total,
}: {
    porTipo: Record<IncidentTab, number>
    total: number
}) {
    const data = useMemo(() => {
        return INCIDENT_TABS
            .map((code) => ({
                code,
                label: `${code} · ${tipoLabel(code)}`,
                value: porTipo[code],
                color: INCIDENT_TAB_COLORS[code],
            }))
            .filter((d) => d.value > 0)
            .sort((a, b) => b.value - a.value)
    }, [porTipo])

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 px-5 py-4">
                <div className="flex items-center gap-2">
                    <CalendarX className="w-4 h-4 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Distribución por tipo</p>
                        <p className="text-xs text-muted-foreground">{total} eventos en el período</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sin incidencias en el período seleccionado.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 items-center">
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="label"
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        paddingAngle={2}
                                    >
                                        {data.map((d) => (
                                            <Cell key={d.code} fill={d.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        wrapperStyle={{ fontSize: 11 }}
                                        formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {data.map((d) => {
                                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                                return (
                                    <div key={d.code} className="flex items-center gap-2 text-xs">
                                        <span
                                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                                            style={{ background: d.color }}
                                        />
                                        <span className="flex-1 truncate text-foreground">{d.label}</span>
                                        <span className="font-mono text-muted-foreground">{d.value}</span>
                                        <span className="font-mono text-muted-foreground/70 w-9 text-right">{pct}%</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function RankingGruposCard({
    titulo, icono, ranking, prefix = "",
}: {
    titulo: string
    icono: React.ReactNode
    ranking: GroupRanking[]
    prefix?: string
}) {
    const top = ranking.slice(0, 8)
    const data = top.map((r) => ({
        label: `${prefix}${r.label}`.length > 24
            ? `${prefix}${r.label}`.slice(0, 22) + "…"
            : `${prefix}${r.label}`,
        full: `${prefix}${r.label}`,
        total: r.total,
    }))

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 px-5 py-4">
                <div className="flex items-center gap-2">
                    {icono}
                    <div>
                        <p className="text-sm font-semibold text-foreground">{titulo}</p>
                        <p className="text-xs text-muted-foreground">Top {data.length}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Sin datos para el período.
                    </p>
                ) : (
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
                            >
                                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    width={140}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                    formatter={(value: number) => [value, "Incidencias"]}
                                    labelFormatter={(label, payload) => {
                                        const item = payload?.[0]?.payload as { full?: string } | undefined
                                        return item?.full ?? label
                                    }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
