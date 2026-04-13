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
  PieChart,
  Pie,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface DeptCumplimiento {
  departamento: string
  asignados: number
  aprobados: number
  reprobados: number
  pendientes: number
  pct: number
}

interface PositionRow {
  id: string
  name: string
  department_id: string
}

interface PositionCourseRow {
  position_id: string
  course_id: string
}

interface EmployeeRow {
  id: string
  nombre: string
  puesto: string | null
  departamento: string | null
}

interface EmployeeCourseRow {
  employee_id: string
  course_id: string | null
  calificacion: number | null
}

interface DepartmentRow {
  id: string
  name: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const META = 80 // porcentaje objetivo de cumplimiento
const APROBADO_MIN = 70 // calificación mínima para aprobar

// ─────────────────────────────────────────────────────────────────────────────
// Colores
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  aprobado:  "hsl(var(--chart-2))",  // verde
  reprobado: "hsl(var(--destructive))",
  pendiente: "hsl(var(--chart-3))",  // amber
}

function colorPct(pct: number): string {
  if (pct >= META) return "hsl(var(--chart-2))"
  if (pct >= 50) return "hsl(var(--chart-3))"
  return "hsl(var(--destructive))"
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip personalizado para barras por departamento
// ─────────────────────────────────────────────────────────────────────────────

interface BarTooltipEntry {
  payload: DeptCumplimiento
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: BarTooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[190px]">
      <p className="font-semibold text-foreground mb-1.5 truncate">{label}</p>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.aprobado }}
            />
            Aprobados
          </span>
          <span className="font-bold text-success">{d.aprobados}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.reprobado }}
            />
            Reprobados
          </span>
          <span className="font-bold text-destructive">{d.reprobados}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.pendiente }}
            />
            Pendientes
          </span>
          <span className="font-medium">{d.pendientes}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t">
          <span>Cumplimiento</span>
          <span
            className="font-bold"
            style={{ color: colorPct(d.pct) }}
          >
            {d.pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginación helper para Supabase
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAll<T>(
  tableName: string,
  selectFields: string,
  filters?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>,
): Promise<T[]> {
  const PAGE = 1000
  let all: T[] = []
  let from = 0
  let hasMore = true
  while (hasMore) {
    let q = supabase.from(tableName).select(selectFields).range(from, from + PAGE - 1) as any
    if (filters) q = filters(q)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    all = all.concat((data ?? []) as T[])
    hasMore = (data?.length ?? 0) === PAGE
    from += PAGE
  }
  return all
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardCumplimiento() {
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [departments, setDepartments] = useState<DepartmentRow[]>([])

  // Datos globales
  const [totalAsignados, setTotalAsignados] = useState(0)
  const [totalAprobados, setTotalAprobados] = useState(0)
  const [totalReprobados, setTotalReprobados] = useState(0)
  const [totalPendientes, setTotalPendientes] = useState(0)
  const [totalEmpleados, setTotalEmpleados] = useState(0)
  const [totalEmpleadosConPuesto, setTotalEmpleadosConPuesto] = useState(0)
  const [deptData, setDeptData] = useState<DeptCumplimiento[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      // ── Cargar catálogos en paralelo ────────────────────────────────────
      const [depts, positions, posCourses, employees, empCourses] =
        await Promise.all([
          fetchAll<DepartmentRow>("departments", "id, name"),
          fetchAll<PositionRow>("positions", "id, name, department_id"),
          fetchAll<PositionCourseRow>("position_courses", "position_id, course_id"),
          fetchAll<EmployeeRow>("employees", "id, nombre, puesto, departamento"),
          fetchAll<EmployeeCourseRow>(
            "employee_courses",
            "employee_id, course_id, calificacion",
          ),
        ])

      setDepartments(depts.sort((a, b) => a.name.localeCompare(b.name)))

      // ── Indexar datos ─────────────────────────────────────────────────
      // Mapa departamento nombre (lower) → id
      const deptNameToId = new Map<string, string>()
      for (const d of depts) deptNameToId.set(d.name.toLowerCase().trim(), d.id)

      // Mapa posición: (name lower + dept_id) → position_id
      const posKey = (name: string, deptId: string) =>
        `${name.toLowerCase().trim()}|${deptId}`
      const posMap = new Map<string, string>()
      for (const p of positions) posMap.set(posKey(p.name, p.department_id), p.id)

      // Cursos requeridos por posición
      const posCourseMap = new Map<string, Set<string>>()
      for (const pc of posCourses) {
        if (!posCourseMap.has(pc.position_id))
          posCourseMap.set(pc.position_id, new Set())
        posCourseMap.get(pc.position_id)!.add(pc.course_id)
      }

      // Cursos tomados por empleado: employee_id → Map<course_id, calificacion>
      const empCourseMap = new Map<string, Map<string, number | null>>()
      for (const ec of empCourses) {
        if (!ec.course_id) continue
        if (!empCourseMap.has(ec.employee_id))
          empCourseMap.set(ec.employee_id, new Map())
        empCourseMap.get(ec.employee_id)!.set(ec.course_id, ec.calificacion)
      }

      // ── Calcular cumplimiento por empleado ────────────────────────────
      const deptAccum = new Map<
        string,
        { asignados: number; aprobados: number; reprobados: number; pendientes: number }
      >()

      let gAsignados = 0
      let gAprobados = 0
      let gReprobados = 0
      let gPendientes = 0
      let gConPuesto = 0

      for (const emp of employees) {
        if (!emp.puesto || !emp.departamento) continue

        const deptId = deptNameToId.get(emp.departamento.toLowerCase().trim())
        if (!deptId) continue

        const posId = posMap.get(posKey(emp.puesto, deptId))
        if (!posId) continue

        const requiredCourses = posCourseMap.get(posId)
        if (!requiredCourses || requiredCourses.size === 0) continue

        gConPuesto++
        const taken = empCourseMap.get(emp.id) ?? new Map()
        const deptName = emp.departamento.trim()

        if (!deptAccum.has(deptName))
          deptAccum.set(deptName, { asignados: 0, aprobados: 0, reprobados: 0, pendientes: 0 })
        const acc = deptAccum.get(deptName)!

        for (const courseId of requiredCourses) {
          gAsignados++
          acc.asignados++

          const cal = taken.get(courseId)
          if (cal === undefined) {
            // No ha tomado el curso
            gPendientes++
            acc.pendientes++
          } else if (cal !== null && cal >= APROBADO_MIN) {
            gAprobados++
            acc.aprobados++
          } else {
            gReprobados++
            acc.reprobados++
          }
        }
      }

      setTotalEmpleados(employees.length)
      setTotalEmpleadosConPuesto(gConPuesto)
      setTotalAsignados(gAsignados)
      setTotalAprobados(gAprobados)
      setTotalReprobados(gReprobados)
      setTotalPendientes(gPendientes)

      const deptArr: DeptCumplimiento[] = Array.from(deptAccum.entries())
        .map(([departamento, v]) => ({
          departamento,
          ...v,
          pct: v.asignados > 0 ? Math.round((v.aprobados / v.asignados) * 100) : 0,
        }))
        .filter((d) => d.asignados > 0)
        .sort((a, b) => b.pct - a.pct)

      setDeptData(deptArr)
    } catch (err) {
      console.error(
        "Cumplimiento error:",
        err instanceof Error ? err.message : JSON.stringify(err),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // ── Filtrar por departamento ──────────────────────────────────────────────
  const filteredDeptData =
    deptFilter === "all"
      ? deptData
      : deptData.filter(
          (d) => d.departamento.toLowerCase() === deptFilter.toLowerCase(),
        )

  // Totales según filtro
  const fAsignados =
    deptFilter === "all"
      ? totalAsignados
      : filteredDeptData.reduce((s, d) => s + d.asignados, 0)
  const fAprobados =
    deptFilter === "all"
      ? totalAprobados
      : filteredDeptData.reduce((s, d) => s + d.aprobados, 0)
  const fReprobados =
    deptFilter === "all"
      ? totalReprobados
      : filteredDeptData.reduce((s, d) => s + d.reprobados, 0)
  const fPendientes =
    deptFilter === "all"
      ? totalPendientes
      : filteredDeptData.reduce((s, d) => s + d.pendientes, 0)
  const pctGeneral =
    fAsignados > 0 ? Math.round((fAprobados / fAsignados) * 100) : 0

  // Datos para dona
  const donaData = [
    { name: "Aprobados", value: fAprobados, color: COLORS.aprobado },
    { name: "Reprobados", value: fReprobados, color: COLORS.reprobado },
    { name: "Pendientes", value: fPendientes, color: COLORS.pendiente },
  ].filter((d) => d.value > 0)

  const isEmpty = fAsignados === 0

  function abrevDept(nombre: string): string {
    if (nombre.length <= 14) return nombre
    return nombre.substring(0, 13) + "…"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <GraduationCap size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                Cumplimiento General de Capacitación
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cursos asignados vs aprobados por puesto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-56 h-8 text-xs">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={cargar}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <GraduationCap size={32} className="opacity-30" />
            <p className="text-sm">
              No hay datos de capacitación configurados aún.
            </p>
            <p className="text-xs">
              Configura puestos y sus cursos requeridos en la sección de
              Capacitación.
            </p>
          </div>
        ) : (
          <>
            {/* ── Resumen general con dona ──────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-5 p-4 rounded-xl bg-muted/50 border">
              {/* Dona */}
              <div className="relative w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donaData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Porcentaje central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-2xl font-bold leading-none"
                    style={{ color: colorPct(pctGeneral) }}
                  >
                    {pctGeneral}%
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    cumplimiento
                  </span>
                </div>
              </div>

              {/* Métricas */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {/* Asignados */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary/10">
                  <span className="p-1.5 rounded-lg text-primary bg-primary/5">
                    <BookOpen size={16} />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold leading-none text-foreground">
                      {fAsignados}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Asignados
                    </span>
                  </div>
                </div>

                {/* Aprobados */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-success/10">
                  <span className="p-1.5 rounded-lg text-success bg-success/5">
                    <CheckCircle2 size={16} />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold leading-none text-foreground">
                      {fAprobados}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Aprobados
                    </span>
                  </div>
                </div>

                {/* Reprobados */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-destructive/10">
                  <span className="p-1.5 rounded-lg text-destructive bg-destructive/5">
                    <XCircle size={16} />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold leading-none text-foreground">
                      {fReprobados}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Reprobados
                    </span>
                  </div>
                </div>

                {/* Pendientes */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-warning/10">
                  <span className="p-1.5 rounded-lg text-warning bg-warning/5">
                    <Clock size={16} />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold leading-none text-foreground">
                      {fPendientes}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Pendientes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Barra de progreso general ─────────────────────────────── */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Progreso general
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {fAprobados} / {fAsignados} cursos aprobados
                  </span>
                  <Badge
                    className="text-[10px] px-1.5"
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
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pctGeneral}%`,
                    backgroundColor: colorPct(pctGeneral),
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">0%</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <TrendingUp size={9} />
                  Meta {META}%
                </span>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
            </div>

            {/* ── Info de empleados ─────────────────────────────────────── */}
            {deptFilter === "all" && (
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <Users size={13} />
                <span>
                  {totalEmpleadosConPuesto} de {totalEmpleados} empleados con
                  puesto y cursos configurados
                </span>
              </div>
            )}

            {/* ── Gráfica de barras por departamento ───────────────────── */}
            {filteredDeptData.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Cumplimiento por departamento
                  </span>
                </div>
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer
                    width="100%"
                    height={filteredDeptData.length * 48 + 40}
                    minHeight={160}
                  >
                    <BarChart
                      data={filteredDeptData}
                      layout="vertical"
                      margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
                      barSize={22}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        className="stroke-muted-foreground/15"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        ticks={[0, 25, 50, 80, 100]}
                      />
                      <YAxis
                        type="category"
                        dataKey="departamento"
                        width={120}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={abrevDept}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      />
                      <Bar
                        dataKey="pct"
                        radius={[0, 4, 4, 0]}
                        background={{
                          fill: "hsl(var(--muted) / 0.2)",
                          radius: 4,
                        }}
                      >
                        {filteredDeptData.map((entry, i) => (
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

                {/* Leyenda */}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground justify-end">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ background: COLORS.aprobado }}
                    />{" "}
                    Cumple (≥ {META}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ background: COLORS.pendiente }}
                    />{" "}
                    Parcial (50–{META - 1}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ background: COLORS.reprobado }}
                    />{" "}
                    No cumple (&lt; 50%)
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
