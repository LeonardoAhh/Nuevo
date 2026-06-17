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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Clock, RefreshCw, AlertTriangle, Users, BookOpen, TrendingUp, Maximize2,
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
  const totalTakings = years.reduce((s, y) => s + y.courseTakings, 0)
  const globalAvg = years.length > 0
    ? Math.round((years.reduce((s, y) => s + y.avgHoursPerEmployee, 0) / years.length) * 100) / 100
    : 0

  const hasNoDuration = coursesWithDurationCount === 0
  const hasNoYearData = !hasNoDuration && years.length === 0
  const showChart = !loading && years.length > 0

  // Datos para el dashboard compacto (año actual si existe)
  const currentYear = String(new Date().getFullYear())
  const currentYearData = years.find(y => y.year === currentYear)

  const ModalContent = () => (
    <>
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
              Horas totales ({years.length} años)
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
              Promedio general
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
    </>
  )

  return (
    <Card data-testid="training-hours-kpi-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">
                Horas de capacitación
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Últimos {years.length} años
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={loading || hasNoYearData}>
                  <Maximize2 size={14} />
                  <span className="hidden sm:inline">Detalle</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Horas de capacitación por año
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <ModalContent />
                </div>
              </DialogContent>
            </Dialog>
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
          <div className="space-y-4 w-full">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : hasNoDuration ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <AlertTriangle size={24} className="text-warning" />
            <p className="text-xs text-center">
              Falta capturar la duración de los cursos.
            </p>
          </div>
        ) : hasNoYearData ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <Clock size={24} className="opacity-30" />
            <p className="text-xs">No hay historial reciente.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {currentYearData ? currentYearData.totalHours.toLocaleString("es-MX", { maximumFractionDigits: 2 }) : grandTotal.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentYearData ? `Horas totales en ${currentYear}` : "Horas totales (histórico)"}
              </span>
            </div>
            
            {showChart && years.length > 1 && (
              <div className="h-20 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={years} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} formatter={(val: number) => [`${val} h`, "Total"]} labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                      {years.map((y, i) => (
                        <Cell key={i} fill={y.year === currentYear ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {showChart && years.length <= 1 && currentYearData && (
              <div className="flex items-center gap-3 mt-2 bg-muted/40 p-3 rounded-lg border">
                <Users size={16} className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{currentYearData.uniqueEmployees} empleados</span>
                  <span className="text-xs text-muted-foreground">capacitados este año</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
