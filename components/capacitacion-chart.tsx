"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
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
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CapacitacionChart() {
  const {
    loading, departments, selectedDept, setSelectedDept,
    chartData, yearTotals, refresh,
  } = useCapacitacionChart()

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
        {loading ? (
          <div className="h-72 flex flex-col justify-end gap-2 pt-4">
            <div className="flex items-end justify-between gap-1.5 flex-1">
              {[40, 60, 35, 75, 50, 85, 45, 65, 55, 80, 38, 70].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-3 flex-1" />
              ))}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-72 text-muted-foreground gap-2">
            <GraduationCap className="h-10 w-10 opacity-30" />
            <p className="text-sm">No hay datos de historial importados aún.</p>
          </div>
        ) : (
          <>
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

                {/* Líneas principales */}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

