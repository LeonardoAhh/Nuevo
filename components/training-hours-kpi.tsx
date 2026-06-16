"use client"

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
  return (
    <div data-testid="hours-kpi-tooltip" className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[200px]">
      <p className="font-semibold text-foreground mb-1.5">Año {label}</p>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Total horas
          </span>
          <span className="font-bold text-foreground">{d.totalHours}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Empleados
          </span>
          <span className="font-medium text-foreground">{d.uniqueEmployees}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Promedio/empleado
          </span>
          <span className="font-bold text-primary">{d.avgHoursPerEmployee} h</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Cursos tomados
          </span>
          <span className="font-medium">{d.courseTakings}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function TrainingHoursKPI() {
  const {
    loading, years, totalCoursesInCatalog, coursesWithDurationCount, refresh,
  } = useTrainingHours()

  const grandTotal = years.reduce((s, y) => s + y.totalHours, 0)
  const totalEmployees = new Set<string>()
  // Approx: average of avgs from yearly stats. We don't have global unique emp set here, so compute weighted avg
  const totalTakings = years.reduce((s, y) => s + y.courseTakings, 0)
  const globalAvg = years.length > 0
    ? Math.round((years.reduce((s, y) => s + y.avgHoursPerEmployee, 0) / years.length) * 100) / 100
    : 0
  void totalEmployees

  const hasNoDuration = coursesWithDurationCount === 0
  const hasNoYearData = !hasNoDuration && years.length === 0
  const showChart = !loading && years.length > 0

  return (
    <Card data-testid="training-hours-kpi-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                Horas de capacitación por año
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suma de horas según la duración de cada curso tomado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5" data-testid="hours-kpi-coverage-badge">
              <BookOpen className="h-3 w-3" />
              {coursesWithDurationCount}/{totalCoursesInCatalog} cursos con duración
            </Badge>
            <Button
              data-testid="hours-kpi-refresh-btn"
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={refresh} disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        ) : hasNoDuration ? (
          <div
            data-testid="hours-kpi-no-duration"
            className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 rounded-xl border border-dashed bg-muted/30"
          >
            <AlertTriangle size={28} className="text-warning" />
            <p className="text-sm font-medium text-foreground">
              Aún no hay cursos con duración capturada
            </p>
            <p className="text-xs text-center max-w-md">
              Ve a <span className="font-medium text-foreground">Capacitación → Cursos</span> y captura la duración (en horas) de cada curso para alimentar este KPI.
            </p>
          </div>
        ) : hasNoYearData ? (
          <div
            data-testid="hours-kpi-no-records"
            className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2"
          >
            <Clock size={28} className="opacity-30" />
            <p className="text-sm">No hay cursos tomados con duración en el historial.</p>
          </div>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div
                data-testid="hours-kpi-total"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/10"
              >
                <span className="p-1.5 rounded-lg text-primary bg-primary/15">
                  <Clock size={18} />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-2xl font-bold leading-none text-foreground tabular-nums">
                    {grandTotal.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    Horas totales
                  </span>
                </div>
              </div>
              <div
                data-testid="hours-kpi-avg"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-success/10"
              >
                <span className="p-1.5 rounded-lg text-success bg-success/15">
                  <TrendingUp size={18} />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-2xl font-bold leading-none text-foreground tabular-nums">
                    {globalAvg.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    Prom. h/empleado/año
                  </span>
                </div>
              </div>
              <div
                data-testid="hours-kpi-takings"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/60 col-span-2 sm:col-span-1"
              >
                <span className="p-1.5 rounded-lg text-foreground bg-background">
                  <BookOpen size={18} />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-2xl font-bold leading-none text-foreground tabular-nums">
                    {totalTakings.toLocaleString("es-MX")}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    Cursos contabilizados
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfica */}
            {showChart && (
              <div className="w-full" data-testid="hours-kpi-chart">
                <ResponsiveContainer width="100%" height={Math.max(220, years.length * 70)}>
                  <BarChart
                    data={years}
                    layout="vertical"
                    margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
                    barSize={28}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      className="stroke-muted-foreground/15"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <YAxis
                      type="category"
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "currentColor", fontWeight: 600 }}
                      className="text-foreground"
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip content={<HoursTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                    <Bar dataKey="totalHours" radius={[0, 6, 6, 0]}>
                      {years.map((_, i) => (
                        <Cell key={i} fill="hsl(var(--primary))" />
                      ))}
                      <LabelList
                        dataKey="totalHours"
                        position="right"
                        formatter={(v: number) => `${v} h`}
                        style={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Tabla complementaria con promedios */}
                <div className="mt-4 grid gap-2" data-testid="hours-kpi-year-list">
                  {years.map(y => (
                    <div
                      key={y.year}
                      data-testid={`hours-kpi-year-${y.year}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border bg-muted/30 text-xs"
                    >
                      <span className="font-semibold text-foreground tabular-nums w-12">{y.year}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users size={11} />
                        <span className="tabular-nums">{y.uniqueEmployees}</span> empl.
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen size={11} />
                        <span className="tabular-nums">{y.courseTakings}</span> cursos
                      </span>
                      <span className="flex items-center gap-1.5 ml-auto">
                        <span className="text-muted-foreground">Prom.</span>
                        <Badge variant="secondary" className="tabular-nums">
                          {y.avgHoursPerEmployee} h
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
