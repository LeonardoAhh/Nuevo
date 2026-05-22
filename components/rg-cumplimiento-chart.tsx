"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, ReferenceLine,
} from "recharts"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useRgCumplimiento, QUARTERS, META_RG as META,
  colorPctRg as colorPct, type DeptDataRg as DeptData, type QuarterId,
} from "@/lib/hooks/useRgCumplimiento"
import { useTheme } from "@/components/theme-context"

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface RgTooltipEntry { payload: DeptData }
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: RgTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const cumple = d.pct >= META
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-1 truncate">{label}</p>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Entregados</span><span className="font-bold text-success">{d.entregados}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Total</span><span className="font-medium">{d.total}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground mt-1 pt-1 border-t">
        <span>Cumplimiento</span>
        <span className={`font-bold ${cumple ? "text-success" : "text-destructive"}`}>{d.pct}%</span>
      </div>
      <div className="mt-1 text-xs">
        <span className={cumple ? "text-success" : "text-destructive"}>
          {cumple ? "✓ Cumple meta (≥70%)" : "✗ No cumple meta (<70%)"}
        </span>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonContent() {
  return (
    <div className="space-y-4">
      {[78, 55, 90, 42, 68].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-20 shrink-0" />
          <div className="flex-1 h-5 bg-muted/50 rounded-sm overflow-hidden">
            <motion.div className="h-full bg-muted-foreground/20 rounded-sm"
              initial={{ width: 0 }} animate={{ width: `${w}%` }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }} />
          </div>
          <Skeleton className="h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RgCumplimientoChart() {
  const {
    loading, quarter, setQuarter, año, setAño,
    chartData, totalGeneral, entregadosGeneral, pctGeneral,
    añosDisponibles, cargar,
  } = useRgCumplimiento()

  const prefersReduced = useReducedMotion()
  const { reducedMotion } = useTheme()
  const skip = !!(prefersReduced || reducedMotion)

  const abrevDept = (n: string) => n.length <= 12 ? n : n.substring(0, 11) + "…"

  // KPI badges inline — mismo patrón CapacitacionChart
  const kpiBadges = [
    { color: colorPct(pctGeneral), label: "Cumplimiento", value: `${pctGeneral}%` },
    { color: "hsl(var(--success))",  label: "Entregados",   value: `${entregadosGeneral}/${totalGeneral}` },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Cumplimiento RG-REC-048</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Por departamento · Trimestral</p>
          {/* KPI badges — solo cuando hay datos */}
          {!loading && totalGeneral > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {kpiBadges.map(({ color, label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Badge variant="secondary" className="text-xs px-1.5">{value}</Badge>
                </div>
              ))}
              <Badge className="text-[10px] px-1.5" variant="outline"
                style={{ backgroundColor: colorPct(pctGeneral) + "22", color: colorPct(pctGeneral), borderColor: colorPct(pctGeneral) + "44" }}>
                {pctGeneral >= META ? "Cumple" : "No cumple"}
              </Badge>
            </div>
          )}
          {/* Tabs trimestres debajo del título */}
          <Tabs value={quarter} onValueChange={v => setQuarter(v as QuarterId)} className="mt-3">
            <TabsList className="grid grid-cols-4 h-8">
              {QUARTERS.map(q => (
                <TabsTrigger key={q.id} value={q.id} className="text-xs px-1">{q.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={año} onValueChange={setAño}>
            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {añosDisponibles.map(y => <SelectItem key={y} value={y!} className="text-xs">{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cargar} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <SkeletonContent />
            </motion.div>
          ) : totalGeneral === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <ShieldCheck size={32} className="opacity-30" />
              <p className="text-sm">Sin registros en este trimestre</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Bar chart — directo, sin wrapper pesado */}
              <div className="w-full overflow-x-auto" role="img"
                aria-label={`Cumplimiento RG-REC-048: ${pctGeneral}% sobre ${chartData.length} departamentos`}>
                <ResponsiveContainer width="100%" height={chartData.length * 48 + 40} minHeight={160}>
                  <BarChart data={chartData} layout="vertical"
                    margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted-foreground/15" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                      tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground"
                      tickLine={false} axisLine={false} ticks={[0, 25, 50, 70, 100]} />
                    <ReferenceLine x={META} stroke="hsl(var(--chart-4))" strokeDasharray="4 3" strokeWidth={1.5}
                      label={{ value: "Meta", position: "top", fontSize: 9, fill: "hsl(var(--chart-4))" }} />
                    <YAxis type="category" dataKey="departamento" width={110}
                      tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground"
                      tickLine={false} axisLine={false} tickFormatter={abrevDept} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]}
                      background={{ fill: "hsl(var(--muted) / 0.2)", radius: 4 }}
                      animationBegin={skip ? undefined : 100} animationDuration={skip ? 0 : 600} animationEasing="ease-out">
                      {chartData.map((e, i) => <Cell key={i} fill={colorPct(e.pct)} />)}
                      <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`}
                        style={{ fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground justify-end">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(var(--chart-2))" }} /> Cumple (≥ 70%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(var(--destructive))" }} /> No cumple (&lt; 70%)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
