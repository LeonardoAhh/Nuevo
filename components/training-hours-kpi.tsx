"use client"

import { useMemo, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock, RefreshCw, AlertTriangle, Users, BookOpen, TrendingUp,
} from "lucide-react"
import { useTrainingHours, type TrainingHoursYearStat } from "@/lib/hooks/useTrainingHours"

// ─── Tooltip ───────────────────────────────────────────────────────────────

interface TooltipEntry { payload: TrainingHoursYearStat; value: number }

function HoursTooltip({
  active, payload, label,
}: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div data-testid="hours-kpi-tooltip" className="bg-popover/95 backdrop-blur-sm border rounded-xl shadow-xl p-3 text-sm min-w-[210px]">
      <p className="font-bold text-foreground mb-2 flex items-center justify-between">
        <span>Año {label}</span>
        <Badge variant="secondary" className="font-bold tabular-nums">
          {d.totalHours} h
        </Badge>
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Empleados
          </span>
          <span className="font-semibold text-foreground tabular-nums">{d.uniqueEmployees}</span>
        </div>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            Cursos tomados
          </span>
          <span className="font-semibold text-foreground tabular-nums">{d.courseTakings}</span>
        </div>
        <div className="flex justify-between gap-3 pt-1.5 mt-1.5 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" />
            Prom. h/empleado
          </span>
          <span className="font-bold text-primary tabular-nums">{d.avgHoursPerEmployee} h</span>
        </div>
      </div>
    </div>
  )
}

// ─── Range filter type ────────────────────────────────────────────────────

type Range = "5y" | "10y" | "all"

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: "5y", label: "5 años" },
  { id: "10y", label: "10 años" },
  { id: "all", label: "Histórico" },
]

// ─── Componente principal ─────────────────────────────────────────────────

export default function TrainingHoursKPI() {
  const {
    loading, years, totalCoursesInCatalog, coursesWithDurationCount, refresh,
  } = useTrainingHours()

  const [range, setRange] = useState<Range>("5y")

  const currentYear = new Date().getFullYear()

  const filteredYears = useMemo(() => {
    if (range === "all") return years
    const minYear = currentYear - (range === "5y" ? 4 : 9)
    return years.filter(y => Number(y.year) >= minYear)
  }, [years, range, currentYear])

  // Métricas agregadas del rango seleccionado
  const totalHoursRange = filteredYears.reduce((s, y) => s + y.totalHours, 0)
  const totalTakingsRange = filteredYears.reduce((s, y) => s + y.courseTakings, 0)
  const avgHoursRange = filteredYears.length > 0
    ? Math.round((filteredYears.reduce((s, y) => s + y.avgHoursPerEmployee, 0) / filteredYears.length) * 100) / 100
    : 0

  // Año actual destacado
  const currentYearStat = years.find(y => y.year === String(currentYear))

  const hasNoDuration = coursesWithDurationCount === 0
  const hasNoYearData = !hasNoDuration && years.length === 0
  const showChart = !loading && filteredYears.length > 0

  // Altura de chart proporcional al # de años (acotada)
  const chartHeight = Math.min(360, Math.max(200, filteredYears.length * 42))

  return (
    <Card data-testid="training-hours-kpi-card" className="overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 ring-1 ring-primary/20">
              <Clock size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">
                Horas de capacitación
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Suma según la duración de cada curso tomado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] gap-1 px-2 py-0.5 font-medium"
              data-testid="hours-kpi-coverage-badge"
              title="Cursos con duración registrada en el catálogo"
            >
              <BookOpen className="h-3 w-3" />
              {coursesWithDurationCount}/{totalCoursesInCatalog} con duración
            </Badge>
            <Button
              data-testid="hours-kpi-refresh-btn"
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={refresh} disabled={loading}
              title="Refrescar"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        ) : hasNoDuration ? (
          <EmptyState
            testid="hours-kpi-no-duration"
            icon={<AlertTriangle size={26} className="text-amber-500" />}
            title="Aún no hay cursos con duración capturada"
            body={
              <>
                Ve a <span className="font-semibold text-foreground">Capacitación → Cursos</span> y captura la duración (en horas) de cada curso para alimentar este KPI.
              </>
            }
          />
        ) : hasNoYearData ? (
          <EmptyState
            testid="hours-kpi-no-records"
            icon={<Clock size={26} className="opacity-30" />}
            title="Sin historial todavía"
            body="No hay cursos tomados con duración registrada."
          />
        ) : (
          <>
            {/* Hero metric: año actual destacado */}
            {currentYearStat && (
              <div
                data-testid="hours-kpi-current-year"
                className="mb-4 rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 flex flex-wrap items-end justify-between gap-4"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-primary/70">
                    {currentYear}
                  </span>
                  <span className="text-4xl font-black tabular-nums leading-none">
                    {currentYearStat.totalHours.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">h</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Metric icon={<Users size={12} />} label="empleados" value={currentYearStat.uniqueEmployees} />
                  <Metric icon={<BookOpen size={12} />} label="cursos" value={currentYearStat.courseTakings} />
                  <Metric
                    icon={<TrendingUp size={12} className="text-primary" />}
                    label="prom h/emp"
                    value={currentYearStat.avgHoursPerEmployee}
                    highlight
                  />
                </div>
              </div>
            )}

            {/* Range toggle */}
            <div
              className="flex items-center justify-between gap-2 mb-3"
              data-testid="hours-kpi-range-toggle"
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Tendencia
              </span>
              <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
                {RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    data-testid={`hours-kpi-range-${opt.id}`}
                    onClick={() => setRange(opt.id)}
                    className={
                      "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all " +
                      (range === opt.id
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Métricas del rango */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <CompactStat
                testid="hours-kpi-total"
                icon={<Clock size={14} />}
                value={totalHoursRange.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                suffix="h"
                label="Totales"
                tone="primary"
              />
              <CompactStat
                testid="hours-kpi-avg"
                icon={<TrendingUp size={14} />}
                value={avgHoursRange.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                suffix="h"
                label="Prom h/emp/año"
                tone="success"
              />
              <CompactStat
                testid="hours-kpi-takings"
                icon={<BookOpen size={14} />}
                value={totalTakingsRange.toLocaleString("es-MX")}
                label="Cursos"
                tone="neutral"
              />
            </div>

            {/* Gráfica */}
            {showChart && (
              <div className="w-full" data-testid="hours-kpi-chart">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart
                    data={filteredYears}
                    layout="vertical"
                    margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient id="hoursBarGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="2 4"
                      horizontal={false}
                      className="stroke-muted-foreground/15"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}h`}
                    />
                    <YAxis
                      type="category"
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "currentColor", fontWeight: 600 }}
                      className="text-foreground"
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<HoursTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
                    <Bar
                      dataKey="totalHours"
                      radius={[0, 8, 8, 0]}
                      fill="url(#hoursBarGradient)"
                      isAnimationActive
                      animationDuration={700}
                    >
                      {filteredYears.map((y) => (
                        <Cell
                          key={y.year}
                          fill={y.year === String(currentYear) ? "hsl(var(--primary))" : "url(#hoursBarGradient)"}
                        />
                      ))}
                      <LabelList
                        dataKey="totalHours"
                        position="right"
                        formatter={(v: number) => `${Math.round(v)} h`}
                        style={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────

function Metric({
  icon, label, value, highlight,
}: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className={"tabular-nums font-bold " + (highlight ? "text-primary" : "text-foreground")}>
        {value}
      </span>
      <span className="text-muted-foreground text-[10px]">{label}</span>
    </span>
  )
}

function CompactStat({
  testid, icon, value, suffix, label, tone,
}: {
  testid: string
  icon: React.ReactNode
  value: string
  suffix?: string
  label: string
  tone: "primary" | "success" | "neutral"
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-muted text-foreground"
  return (
    <div
      data-testid={testid}
      className="rounded-xl border bg-card/60 p-2.5 flex items-center gap-2.5 min-w-0"
    >
      <span className={"p-1.5 rounded-lg shrink-0 " + toneClass}>{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-base font-bold leading-none tabular-nums truncate">
          {value}
          {suffix && <span className="text-[11px] text-muted-foreground font-medium ml-0.5">{suffix}</span>}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 leading-tight truncate">{label}</span>
      </div>
    </div>
  )
}

function EmptyState({
  testid, icon, title, body,
}: { testid: string; icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 rounded-xl border border-dashed bg-muted/20"
    >
      {icon}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-center max-w-md leading-relaxed">{body}</p>
    </div>
  )
}
