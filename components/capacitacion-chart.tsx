"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Info, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCapacitacionChart,
  YEARS,
  COLORS_CHART as COLORS,
} from "@/lib/hooks/useCapacitacionChart"
import { useTheme } from "@/components/theme-context"

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipEntry {
  dataKey: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const dataPoints = payload.filter((p) => !p.dataKey.includes("_trend"))
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[150px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {dataPoints.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.dataKey}
          </span>
          <span className="font-medium text-foreground">
            {p.value} {p.value === 1 ? "curso" : "cursos"}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton content-aware — líneas SVG
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonContent() {
  return (
    <div className="h-72 flex flex-col gap-3 pt-2">
      {/* Header badges skeleton */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-5 w-16 rounded-full" />
        ))}
      </div>
      {/* Line chart skeleton */}
      <div className="flex-1 relative overflow-hidden rounded-lg bg-muted/30">
        {/* Simulated wave lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {[
            { d: "M0,60 C40,40 80,80 120,55 C160,30 200,70 240,50 C280,30 320,65 360,45", delay: 0, color: "hsl(var(--chart-1))" },
            { d: "M0,80 C40,60 80,95 120,70 C160,45 200,85 240,65 C280,50 320,80 360,60", delay: 0.1, color: "hsl(var(--chart-2))" },
            { d: "M0,45 C40,65 80,50 120,40 C160,55 200,45 240,60 C280,40 320,55 360,42", delay: 0.2, color: "hsl(var(--chart-3))" },
          ].map((line, i) => (
            <motion.path
              key={i}
              d={line.d}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeOpacity={0.25}
              pathLength={0}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: line.delay, ease: "easeInOut" }}
            />
          ))}
        </svg>
        {/* X axis skeleton */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 flex-1" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CapacitacionChart() {
  const {
    loading, departments, selectedDept, setSelectedDept,
    chartData, yearTotals, refresh,
  } = useCapacitacionChart()

  const prefersReduced = useReducedMotion()
  const { reducedMotion } = useTheme()
  const skip = !!(prefersReduced || reducedMotion)

  const isEmpty = chartData.every(
    p => p["2024"] === 0 && p["2025"] === 0 && p["2026"] === 0
  )

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Comparación Anual de Cursos Impartidos
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {yearTotals.map(({ year, total }) => (
              <div key={year} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[year] }} />
                <span className="text-xs text-muted-foreground">{year}</span>
                <Badge variant="secondary" className="text-xs px-1.5">
                  {total}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => refresh()}
            disabled={loading}
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full sm:w-56 h-8 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonContent />
            </motion.div>
          ) : isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center h-72 text-muted-foreground gap-2"
            >
              <GraduationCap className="h-10 w-10 opacity-30" />
              <p className="text-sm">No hay datos de historial importados aún.</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div role="img" aria-label="Capacitaciones completadas por mes y año">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted-foreground/15"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) => {
                        if (value.includes("_trend")) return null
                        return <span style={{ color: COLORS[value] }}>{value}</span>
                      }}
                      payload={([...YEARS.map(y => ({
                        value: y as string,
                        type: "line" as const,
                        color: COLORS[y],
                        id: y as string,
                      })), { value: "Tendencia", type: "line" as const, color: "hsl(var(--muted-foreground))", id: "trend" }])}
                    />

                    {/* Líneas principales con animación draw */}
                    {YEARS.map(year => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={year}
                        stroke={COLORS[year]}
                        strokeWidth={2}
                        dot={{ r: 3.5, fill: COLORS[year], strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        connectNulls
                        animationDuration={skip ? 0 : 1200}
                        animationEasing="ease-in-out"
                      />
                    ))}

                    {/* Líneas de tendencia (dashed) */}
                    {YEARS.map(year => (
                      <Line
                        key={`${year}_trend`}
                        type="linear"
                        dataKey={`${year}_trend`}
                        stroke={COLORS[year]}
                        strokeWidth={1.5}
                        strokeDasharray="5 4"
                        dot={false}
                        activeDot={false}
                        legendType="none"
                        animationDuration={skip ? 0 : 1400}
                        animationEasing="ease-in-out"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Nota al pie */}
              <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Solo se cuentan cursos únicos por mes (un curso solo se cuenta una vez por mes aunque se haya impartido varias veces)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
