"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, RefreshCw } from "lucide-react"
import {
  useYearlyCompliance, COLORS_YEARLY as COLORS, type YearStats,
} from "@/lib/hooks/useYearlyCompliance"
import { useTheme } from "@/components/theme-context"

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipEntry { dataKey: string; value: number; color: string }
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const row = (payload[0] as unknown as { payload: YearStats }).payload
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-muted-foreground">
        {[
          { label: "Aprobados",  value: row.aprobados,  color: COLORS.aprobado,  cls: "" },
          { label: "Reprobados", value: row.reprobados, color: COLORS.reprobado, cls: "text-destructive" },
          { label: "Pendientes", value: row.pendientes, color: COLORS.pendiente, cls: "" },
        ].map(r => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.label}
            </span>
            <span className={`font-bold ${r.cls}`} style={!r.cls ? { color: r.color } : undefined}>{r.value}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t">
          <span>Cumplimiento</span>
          <span className="font-bold" style={{ color: COLORS.aprobado }}>{row.pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Empleados</span><span className="font-medium">{row.empleados}</span>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonContent() {
  return (
    <div className="space-y-4">
      {[65, 82, 48].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-12 shrink-0" />
          <div className="flex-1 h-7 bg-muted/50 rounded-sm overflow-hidden">
            <motion.div className="h-full bg-muted-foreground/20 rounded-sm"
              initial={{ width: 0 }} animate={{ width: `${w}%` }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }} />
          </div>
        </div>
      ))}
      <div className="space-y-2 pt-2 border-t">
        {[72, 58, 45].map((w, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-16" />
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div className="h-full bg-muted-foreground/20 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${w}%` }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: "easeOut" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardYearlyCompliance() {
  const { loading, yearStats, cargar } = useYearlyCompliance()

  const prefersReduced = useReducedMotion()
  const { reducedMotion } = useTheme()
  const skip = !!(prefersReduced || reducedMotion)

  const isEmpty       = yearStats.every(s => s.asignados === 0)
  const totalEmpleados = yearStats.reduce((s, y) => s + y.empleados, 0)
  const totalAprobados = yearStats.reduce((s, y) => s + y.aprobados, 0)
  const totalAsignados = yearStats.reduce((s, y) => s + y.asignados, 0)
  const pctGlobal     = totalAsignados > 0 ? Math.round((totalAprobados / totalAsignados) * 100) : 0

  // KPI badges — igual que CapacitacionChart yearTotals
  const kpiBadges = [
    { color: "hsl(var(--primary))", label: "Empleados",  value: totalEmpleados },
    { color: COLORS.aprobado,       label: "Aprobados",  value: totalAprobados },
    { color: COLORS.aprobado,       label: "Global",     value: `${pctGlobal}%` },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Cumplimiento por Año de Ingreso</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avance en cursos asignados por puesto según fecha de ingreso
          </p>
          {/* KPI badges inline — mismo patrón CapacitacionChart */}
          {!loading && !isEmpty && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {kpiBadges.map(({ color, label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Badge variant="secondary" className="text-xs px-1.5">{value}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
          onClick={cargar} disabled={loading} aria-label="Actualizar">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <SkeletonContent />
            </motion.div>
          ) : isEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <TrendingUp size={32} className="opacity-30" />
              <p className="text-sm">No hay datos de cumplimiento por año aún.</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Stacked bar chart — directo */}
              <div role="img" aria-label={`Cumplimiento por año de ingreso: ${pctGlobal}% global`}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={yearStats} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/15" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="year" tick={{ fontSize: 12, fontWeight: 600 }}
                      className="text-muted-foreground" axisLine={false} tickLine={false} width={55} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(v: string) => (
                        <span className="text-muted-foreground capitalize">
                          {v === "aprobados" ? "Aprobados" : v === "reprobados" ? "Reprobados" : "Pendientes"}
                        </span>
                      )}
                    />
                    <Bar dataKey="aprobados" stackId="a" fill={COLORS.aprobado}
                      animationBegin={skip ? undefined : 100} animationDuration={skip ? 0 : 700} animationEasing="ease-out" />
                    <Bar dataKey="reprobados" stackId="a" fill={COLORS.reprobado}
                      animationBegin={skip ? undefined : 200} animationDuration={skip ? 0 : 700} animationEasing="ease-out" />
                    <Bar dataKey="pendientes" stackId="a" fill={COLORS.pendiente} radius={[0, 4, 4, 0]}
                      animationBegin={skip ? undefined : 300} animationDuration={skip ? 0 : 700} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Progress bars por año */}
              <div className="mt-5 space-y-3">
                {yearStats.map((s, i) => (
                  <div key={s.year} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.year}</span>
                      <span className="text-muted-foreground">
                        {s.aprobados} / {s.asignados} cursos
                        <span className="ml-2 font-semibold" style={{ color: COLORS.aprobado }}>{s.pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: COLORS.aprobado }}
                        initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: skip ? 0 : 0.3 + i * 0.1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
