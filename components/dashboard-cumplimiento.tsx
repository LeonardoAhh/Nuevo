"use client"

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, PieChart, Pie,
} from "recharts"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, RefreshCw, CheckCircle2, XCircle, Clock, BookOpen, TrendingUp, Users } from "lucide-react"
import {
  useCumplimiento, colorPct, META,
  COLORS_CUMPLIMIENTO as COLORS, type DeptCumplimiento,
} from "@/lib/hooks/useCumplimiento"
import { useTheme } from "@/components/theme-context"

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface BarTooltipEntry { payload: DeptCumplimiento }
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: BarTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[190px]">
      <p className="font-semibold text-foreground mb-1.5 truncate">{label}</p>
      <div className="space-y-1 text-muted-foreground">
        {[
          { label: "Aprobados", value: d.aprobados, color: COLORS.aprobado, cls: "text-success" },
          { label: "Reprobados", value: d.reprobados, color: COLORS.reprobado, cls: "text-destructive" },
          { label: "Pendientes", value: d.pendientes, color: COLORS.pendiente, cls: "" },
        ].map(r => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.label}
            </span>
            <span className={`font-bold ${r.cls}`}>{r.value}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t">
          <span>Cumplimiento</span>
          <span className="font-bold" style={{ color: colorPct(d.pct) }}>{d.pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonContent() {
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="relative w-[120px] h-[120px]">
          <Skeleton className="w-full h-full rounded-full" />
          <div className="absolute inset-[24px] rounded-full bg-card" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-20" /></div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {[78, 55, 90, 42, 68].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-24 shrink-0" />
          <div className="flex-1 h-5 bg-muted/60 rounded-sm overflow-hidden">
            <motion.div className="h-full bg-muted-foreground/20 rounded-sm"
              initial={{ width: 0 }} animate={{ width: `${w}%` }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }} />
          </div>
          <Skeleton className="h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardCumplimiento() {
  const {
    loading, departments, deptData, cargar,
    totalAsignados, totalAprobados, totalReprobados, totalPendientes,
    totalEmpleados, totalEmpleadosConPuesto,
  } = useCumplimiento()

  const prefersReduced = useReducedMotion()
  const { reducedMotion } = useTheme()
  const skip = !!(prefersReduced || reducedMotion)

  const [deptFilter, setDeptFilter] = useState<string>("all")

  const filteredDeptData = deptFilter === "all"
    ? deptData
    : deptData.filter(d => d.departamento.toLowerCase() === deptFilter.toLowerCase())

  const fAsignados  = deptFilter === "all" ? totalAsignados  : filteredDeptData.reduce((s, d) => s + d.asignados, 0)
  const fAprobados  = deptFilter === "all" ? totalAprobados  : filteredDeptData.reduce((s, d) => s + d.aprobados, 0)
  const fReprobados = deptFilter === "all" ? totalReprobados : filteredDeptData.reduce((s, d) => s + d.reprobados, 0)
  const fPendientes = deptFilter === "all" ? totalPendientes : filteredDeptData.reduce((s, d) => s + d.pendientes, 0)
  const pctGeneral  = fAsignados > 0 ? Math.round((fAprobados / fAsignados) * 100) : 0

  const donaData = [
    { name: "Aprobados", value: fAprobados, color: COLORS.aprobado },
    { name: "Reprobados", value: fReprobados, color: COLORS.reprobado },
    { name: "Pendientes", value: fPendientes, color: COLORS.pendiente },
  ].filter(d => d.value > 0)

  const isEmpty = fAsignados === 0
  const abrevDept = (n: string) => n.length <= 14 ? n : n.substring(0, 13) + "…"

  // KPI badges — misma estructura que CapacitacionChart yearTotals
  const kpiBadges = [
    { color: "hsl(var(--primary))",      label: "Asignados",  value: fAsignados },
    { color: COLORS.aprobado,            label: "Aprobados",  value: fAprobados },
    { color: COLORS.reprobado,           label: "Reprobados", value: fReprobados },
    { color: COLORS.pendiente,           label: "Pendientes", value: fPendientes },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Cumplimiento General de Capacitación
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Cursos asignados vs aprobados por puesto</p>
          {/* KPI badges inline — igual que CapacitacionChart */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {kpiBadges.map(({ color, label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge variant="secondary" className="text-xs px-1.5">{value}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full sm:w-56 h-8 text-xs">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
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
          ) : isEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <GraduationCap size={32} className="opacity-30" />
              <p className="text-sm">No hay datos de capacitación configurados aún.</p>
              <p className="text-xs">Configura puestos y sus cursos requeridos en la sección de Capacitación.</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {/* Dona */}
              <div className="flex justify-center mb-4"
                role="img" aria-label={`Cumplimiento general: ${pctGeneral}%`}>
                <div className="relative w-[120px] h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donaData} cx="50%" cy="50%" innerRadius={36} outerRadius={54}
                        paddingAngle={3} dataKey="value" strokeWidth={0}
                        animationBegin={skip ? undefined : 200} animationDuration={skip ? 0 : 800} animationEasing="ease-out">
                        {donaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-xl font-bold leading-none tabular-nums" style={{ color: colorPct(pctGeneral) }}
                      initial={skip ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}>
                      {pctGeneral}%
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">cumplimiento</span>
                  </div>
                </div>
              </div>

              {/* Progress general */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Progreso general</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fAprobados} / {fAsignados} cursos</span>
                    <Badge className="text-[10px] px-1.5" variant="outline"
                      style={{ backgroundColor: colorPct(pctGeneral) + "22", color: colorPct(pctGeneral), borderColor: colorPct(pctGeneral) + "44" }}>
                      {pctGeneral >= META ? "Cumple" : "No cumple"}
                    </Badge>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: colorPct(pctGeneral) }}
                    initial={{ width: 0 }} animate={{ width: `${pctGeneral}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: skip ? 0 : 0.35 }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0%</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><TrendingUp size={9} />Meta {META}%</span>
                  <span className="text-[10px] text-muted-foreground">100%</span>
                </div>
              </div>

              {/* Info empleados */}
              {deptFilter === "all" && (
                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                  <Users size={13} />
                  <span>{totalEmpleadosConPuesto} de {totalEmpleados} empleados con puesto y cursos configurados</span>
                </div>
              )}

              {/* Bar chart por departamento */}
              {filteredDeptData.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                    Cumplimiento por departamento
                  </p>
                  <div className="w-full overflow-x-auto" role="img"
                    aria-label={`Cumplimiento por departamento: ${filteredDeptData.length} departamentos`}>
                    <ResponsiveContainer width="100%" height={filteredDeptData.length * 48 + 40} minHeight={160}>
                      <BarChart data={filteredDeptData} layout="vertical"
                        margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted-foreground/15" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                          tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground"
                          tickLine={false} axisLine={false} ticks={[0, 25, 50, 80, 100]} />
                        <YAxis type="category" dataKey="departamento" width={120}
                          tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground"
                          tickLine={false} axisLine={false} tickFormatter={abrevDept} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                        <Bar dataKey="pct" radius={[0, 4, 4, 0]}
                          background={{ fill: "hsl(var(--muted) / 0.2)", radius: 4 }}
                          animationBegin={skip ? undefined : 100} animationDuration={skip ? 0 : 700} animationEasing="ease-out">
                          {filteredDeptData.map((e, i) => <Cell key={i} fill={colorPct(e.pct)} />)}
                          <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`}
                            style={{ fontSize: 11, fontWeight: 700 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground justify-end">
                    {[
                      { color: COLORS.aprobado,  label: `Cumple (≥ ${META}%)` },
                      { color: COLORS.pendiente, label: `Parcial (50–${META - 1}%)` },
                      { color: COLORS.reprobado, label: "No cumple (< 50%)" },
                    ].map(l => (
                      <span key={l.label} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
