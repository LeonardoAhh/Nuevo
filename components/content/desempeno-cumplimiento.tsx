"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  Layers,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  ExternalLink,
  MinusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCumplimientoDesempeno } from "@/lib/hooks/useCumplimientoDesempeno"
import type { EmpleadoCumplimiento } from "@/lib/hooks/useCumplimientoDesempeno"
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo"

// ─── Motion variants ─────────────────────────────────────────────────────────

const cardV = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
}

const expandV = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ─── Status badge ────────────────────────────────────────────────────────────

function EstatusBadge({ estatus }: { estatus: EmpleadoCumplimiento["estatus"] }) {
  if (estatus === "auto") {
    return (
      <Badge className="bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)] border-0 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Entregada (Auto)
      </Badge>
    )
  }
  if (estatus === "manual") {
    return (
      <Badge className="bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info))] hover:bg-[hsl(var(--info)/0.2)] border-0 gap-1">
        <FileText className="h-3 w-3" />
        Entregada (Manual)
      </Badge>
    )
  }
  if (estatus === "no_aplica") {
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-0 gap-1">
        <MinusCircle className="h-3 w-3" />
        No aplica (&lt; 3 meses)
      </Badge>
    )
  }
  return (
    <Badge className="bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.2)] border-0 gap-1">
      <Clock className="h-3 w-3" />
      Pendiente
    </Badge>
  )
}

// ─── Employee row ────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  emp: EmpleadoCumplimiento
  saving: boolean
  isReadOnly: boolean
  onToggle: (numero: string, entregada: boolean, fechaIngreso: string | null) => void
}

function EmployeeRow({ emp, saving, isReadOnly, onToggle }: EmployeeRowProps) {
  const entregadaManual = emp.estatus === "manual"
  const entregadaAuto = emp.estatus === "auto"
  const noAplica = emp.estatus === "no_aplica"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{emp.nombre}</p>
          <span className="text-[11px] font-mono text-muted-foreground shrink-0">#{emp.numero}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
          {emp.puesto && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {emp.puesto}
            </span>
          )}
          {emp.area && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" /> {emp.area}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <EstatusBadge estatus={emp.estatus} />
        {entregadaAuto && emp.calificacionFinal != null && (
          <Badge variant="outline" className="font-mono text-[11px]">
            {emp.calificacionFinal}
          </Badge>
        )}
        {entregadaAuto && (
          <Button asChild size="icon" variant="ghost" className="h-7 w-7" aria-label="Abrir evaluación">
            <Link href={`/desempeno?numero=${encodeURIComponent(emp.numero)}`}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        {!entregadaAuto && !noAplica && !isReadOnly && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Manual</span>
            <Switch
              checked={entregadaManual}
              disabled={saving}
              onCheckedChange={(checked) => onToggle(emp.numero, checked, emp.fechaIngreso)}
              aria-label="Marcar entrega manual"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DesempenoCumplimientoContent() {
  const { isReadOnly } = useRole()
  const [periodo, setPeriodo] = useState<DesempenoPeriodo>(PERIODOS_DESEMPENO.semestrales[0])
  const { loading, saving, deptGroups, resumen, cargar, marcarEntrega } =
    useCumplimientoDesempeno(periodo)

  const [search, setSearch] = useState("")
  const [filterEstatus, setFilterEstatus] = useState<"all" | "pendiente" | "entregada" | "no_aplica">("all")
  const [expandedDept, setExpandedDept] = useState<Record<string, boolean>>({})

  const toggleDept = (dept: string) =>
    setExpandedDept((prev) => ({ ...prev, [dept]: !prev[dept] }))

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return deptGroups
      .map((g) => {
        const empleados = g.empleados.filter((e) => {
          if (q) {
            const hit =
              e.nombre.toLowerCase().includes(q) ||
              e.numero.toLowerCase().includes(q) ||
              (e.puesto ?? "").toLowerCase().includes(q)
            if (!hit) return false
          }
          if (filterEstatus === "pendiente" && e.estatus !== "pendiente") return false
          if (filterEstatus === "entregada" && e.estatus !== "auto" && e.estatus !== "manual") return false
          if (filterEstatus === "no_aplica" && e.estatus !== "no_aplica") return false
          return true
        })
        return { ...g, empleados }
      })
      .filter((g) => g.empleados.length > 0)
  }, [deptGroups, search, filterEstatus])

  return (
    <Card className="rounded-none border-x-0 border-t-0 shadow-none min-h-full">
      <CardHeader className="pt-4 pb-3 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg font-bold uppercase tracking-wide">
              Cumplimiento de Evaluaciones
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Auto-detecta entregas vía /desempeño · marcado manual para entregas en papel
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={cargar}
              disabled={loading}
              aria-label="Refrescar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6 px-4 sm:px-5 space-y-4">
        {isReadOnly && <ReadOnlyBanner />}

        {/* Period selector + filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as DesempenoPeriodo)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS_DESEMPENO.semestrales.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado, número o puesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Select value={filterEstatus} onValueChange={(v) => setFilterEstatus(v as typeof filterEstatus)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entregada">Entregadas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="no_aplica">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Global KPI */}
        <Alert className="flex items-center gap-3 [&>svg]:static [&>svg]:translate-y-0 [&>svg~*]:pl-0">
          <AlertDescription className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tabular-nums">{resumen.porcentaje}%</span>
                <div className="text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">{resumen.entregadas}</span> de{" "}
                    <span className="font-semibold text-foreground">{resumen.total}</span> entregadas
                  </div>
                  <div>{resumen.pendientes} pendientes</div>
                </div>
              </div>
              <Progress value={resumen.porcentaje} className="h-2 flex-1" />
            </div>
          </AlertDescription>
        </Alert>

        {/* Departments */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 opacity-50" />
            <p className="text-sm">Sin resultados para los filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((g) => {
              const isExpanded = expandedDept[g.departamento] ?? true
              const ChevronIcon = isExpanded ? ChevronDown : ChevronRight
              return (
                <motion.div
                  key={g.departamento}
                  variants={cardV}
                  initial="hidden"
                  animate="show"
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleDept(g.departamento)}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    aria-expanded={isExpanded}
                  >
                    <ChevronIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold uppercase tracking-wide truncate">
                        {g.departamento}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {g.entregadas}/{g.total} entregadas · {g.pendientes} pendientes
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums">{g.porcentaje}%</span>
                      <div className="w-16 sm:w-20">
                        <Progress value={g.porcentaje} className="h-1.5" />
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={expandV}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="px-3 sm:px-4 pb-3 pt-1 space-y-1.5">
                          {g.empleados.map((emp) => (
                            <EmployeeRow
                              key={emp.id}
                              emp={emp}
                              saving={saving}
                              isReadOnly={isReadOnly}
                              onToggle={(numero, entregada, fechaIngreso) =>
                                marcarEntrega(numero, entregada, { fechaIngreso })
                              }
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
