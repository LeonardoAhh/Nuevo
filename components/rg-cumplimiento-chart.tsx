"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface RegistroRaw {
  fecha_vencimiento_rg: string | null
  departamento: string | null
  rg_rec_048: string
}

interface DeptData {
  departamento: string
  total: number
  entregados: number
  pct: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const QUARTERS = [
  { id: "Q1", label: "ENE – MAR", meses: [0, 1, 2] },
  { id: "Q2", label: "ABR – JUN", meses: [3, 4, 5] },
  { id: "Q3", label: "JUL – SEP", meses: [6, 7, 8] },
  { id: "Q4", label: "OCT – DIC", meses: [9, 10, 11] },
] as const

type QuarterId = "Q1" | "Q2" | "Q3" | "Q4"

function currentQuarter(): QuarterId {
  const mes = new Date().getMonth()
  if (mes <= 2) return "Q1"
  if (mes <= 5) return "Q2"
  if (mes <= 8) return "Q3"
  return "Q4"
}

function currentYear(): string {
  return String(new Date().getFullYear())
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip personalizado
// ─────────────────────────────────────────────────────────────────────────────

const META = 70  // % mínimo obligatorio

interface RgTooltipEntry {
  payload: DeptData
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: RgTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const cumple = d.pct >= META
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-1 truncate">{label}</p>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Entregados</span>
        <span className="font-bold text-success">{d.entregados}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Total</span>
        <span className="font-medium">{d.total}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground mt-1 pt-1 border-t">
        <span>Cumplimiento</span>
        <span className={`font-bold ${cumple ? "text-success" : "text-destructive"}`}>
          {d.pct}%
        </span>
      </div>
      <div className="mt-1 text-xs">
        <span className={cumple ? "text-success" : "text-destructive"}>
          {cumple ? "✓ Cumple meta (≥70%)" : "✗ No cumple meta (<70%)"}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Color por porcentaje
// ─────────────────────────────────────────────────────────────────────────────

function colorPct(pct: number): string {
  if (pct >= META) return "hsl(var(--chart-2))" // green — cumple meta ≥70%
  return "hsl(var(--destructive))"               // red — no cumple
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function RgCumplimientoChart() {
  const [registros, setRegistros] = useState<RegistroRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [quarter, setQuarter] = useState<QuarterId>(currentQuarter())
  const [año, setAño] = useState(currentYear())

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("nuevo_ingreso")
        .select("fecha_vencimiento_rg, departamento, rg_rec_048")
        .not("fecha_vencimiento_rg", "is", null)
      if (error) throw error
      setRegistros((data ?? []) as RegistroRaw[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Calcular datos del trimestre seleccionado ──────────────────────────────

  const añoNum = parseInt(año, 10)
  const mesesQ = QUARTERS.find((q) => q.id === quarter)!.meses

  const filtrados = registros.filter((r) => {
    if (!r.fecha_vencimiento_rg) return false
    const d = new Date(r.fecha_vencimiento_rg + "T00:00:00")
    return d.getFullYear() === añoNum && mesesQ.includes(d.getMonth())
  })

  // Agrupar por departamento
  const deptMap = new Map<string, { total: number; entregados: number }>()
  for (const r of filtrados) {
    const dept = r.departamento ?? "Sin departamento"
    if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, entregados: 0 })
    const entry = deptMap.get(dept)!
    entry.total++
    if (r.rg_rec_048 === "Entregado") entry.entregados++
  }

  const chartData: DeptData[] = Array.from(deptMap.entries())
    .map(([departamento, { total, entregados }]) => ({
      departamento,
      total,
      entregados,
      pct: total > 0 ? Math.round((entregados / total) * 100) : 0,
    }))
    .filter((d) => d.total > 0)           // ocultar departamentos sin registros
    .sort((a, b) => b.pct - a.pct)

  // ── Resumen del trimestre ─────────────────────────────────────────────────

  const totalGeneral     = filtrados.length
  const entregadosGeneral = filtrados.filter((r) => r.rg_rec_048 === "Entregado").length
  const pctGeneral       = totalGeneral > 0 ? Math.round((entregadosGeneral / totalGeneral) * 100) : 0

  // ── Años disponibles ──────────────────────────────────────────────────────

  const añosDisponibles = Array.from(
    new Set(registros.map((r) => r.fecha_vencimiento_rg?.split("-")[0]).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a))
  if (!añosDisponibles.includes(año)) añosDisponibles.unshift(año)

  // ── Nombre abreviado del departamento (para eje X) ───────────────────────

  function abrevDept(nombre: string): string {
    if (nombre.length <= 12) return nombre
    return nombre.substring(0, 11) + "…"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/15">
              <ShieldCheck size={18} className="text-success" />
            </div>
            <div>
              <CardTitle className="text-base">Cumplimiento RG-REC-048</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Por departamento · Trimestral</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de año */}
            <Select value={año} onValueChange={setAño}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {añosDisponibles.map((y) => (
                  <SelectItem key={y} value={y!} className="text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón recargar */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={cargar}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Tabs de trimestres */}
        <Tabs value={quarter} onValueChange={(v) => setQuarter(v as QuarterId)} className="mt-3">
          <TabsList className="w-full grid grid-cols-4 h-8">
            {QUARTERS.map((q) => (
              <TabsTrigger key={q.id} value={q.id} className="text-xs px-1">
                {q.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : totalGeneral === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <ShieldCheck size={32} className="opacity-30" />
            <p className="text-sm">Sin registros en este trimestre</p>
          </div>
        ) : (
          <>
            {/* Resumen general */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/50 border">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Cumplimiento general del trimestre</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${pctGeneral >= META ? "text-success" : "text-destructive"}`}>
                    {pctGeneral}%
                  </span>
                  <span className="text-xs text-muted-foreground">{entregadosGeneral} / {totalGeneral} entregados</span>
                  <span className="text-xs text-muted-foreground">· meta 70%</span>
                </div>
                {/* Barra de progreso general */}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctGeneral}%`, backgroundColor: colorPct(pctGeneral) }}
                  />
                </div>
              </div>
              <Badge
                className="shrink-0 text-xs"
                style={{
                  backgroundColor: colorPct(pctGeneral) + "22",
                  color: colorPct(pctGeneral),
                  borderColor: colorPct(pctGeneral) + "44",
                }}
                variant="outline"
              >
                {pctGeneral >= META ? "Cumple" : "No cumple"}
              </Badge>
            </div>

            {/* Gráfica de barras */}
            <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={chartData.length * 48 + 40} minHeight={160}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
                barSize={22}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted-foreground/30" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 25, 50, 70, 100]}
                />
                <ReferenceLine x={META} stroke="hsl(var(--chart-4))" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Meta", position: "top", fontSize: 9, fill: "hsl(var(--chart-4))" }} />
                <YAxis
                  type="category"
                  dataKey="departamento"
                  width={110}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={abrevDept}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} background={{ fill: "hsl(var(--muted) / 0.2)", radius: 4 }}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={colorPct(entry.pct)} />
                  ))}
                  <LabelList
                    dataKey="pct"
                    position="right"
                    formatter={(v: number) => `${v}%`}
                    style={{ fontSize: 11, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>

            {/* Leyenda de colores */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground justify-end">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:"hsl(var(--chart-2))"}} /> Cumple (≥ 70%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:"hsl(var(--destructive))"}} /> No cumple (&lt; 70%)</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
