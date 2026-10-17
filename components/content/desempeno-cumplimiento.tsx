"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, ChevronDown, ChevronRight, Clock3, FileText, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { useRole } from "@/lib/hooks"
import { useCumplimientoDesempeno, type DeptCumplimiento, type EmpleadoCumplimiento } from "@/lib/hooks/useCumplimientoDesempeno"
import { getPeriodoActual, type PeriodoModo } from "@/lib/catalogo"
import { getVentanaEntrega } from "@/lib/desempeno/ventana-entrega"

type StatusFilter = "all" | "pendiente" | "entregada" | "no_aplica"

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" })

function Metric({ label, value, detail, loading }: { label: string; value: number; detail: string; loading: boolean }) {
  return (
    <Card className="min-w-0">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold leading-8 tabular-nums">{value}</p>}
        {loading ? <Skeleton className="h-4 w-24" /> : <p className="text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}

function EmployeeStatus({ employee }: { employee: EmpleadoCumplimiento }) {
  const statuses = {
    auto: { icon: CheckCircle2, label: "Evaluación guardada", variant: "success" },
    manual: { icon: FileText, label: "Entrega manual", variant: "info" },
    pendiente: { icon: Clock3, label: "Pendiente", variant: "warning" },
    no_aplica: { icon: Clock3, label: "No aplica", variant: "secondary" },
  } as const
  const status = statuses[employee.estatus]
  const Icon = status.icon
  return (
    <Badge variant={status.variant} className="gap-1.5 whitespace-nowrap font-medium">
      <Icon className="size-3.5" aria-hidden="true" />
      {status.label}
    </Badge>
  )
}

function EmployeeRow({
  employee,
  saving,
  isReadOnly,
  onManual,
  onPhysical,
}: {
  employee: EmpleadoCumplimiento
  saving: boolean
  isReadOnly: boolean
  onManual: (numero: string, checked: boolean, fechaIngreso: string | null) => void
  onPhysical: (numero: string, checked: boolean) => void
}) {
  const [pendingManual, setPendingManual] = useState<boolean | null>(null)
  const hasEvaluation = employee.estatus === "auto"
  const canMarkManual = employee.estatus !== "auto" && employee.estatus !== "no_aplica"

  const confirmManual = () => {
    if (pendingManual === null) return
    onManual(employee.numero, pendingManual, employee.fechaIngreso)
    setPendingManual(null)
  }

  return (
    <li className="min-w-0 rounded-md border border-border bg-card px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48 space-y-0.5">
          <p className="text-xs tabular-nums text-muted-foreground">#{employee.numero}{employee.origen === "nuevo_ingreso" ? " · Nuevo ingreso" : ""}</p>
          <p className="break-words text-sm font-medium text-foreground">{employee.nombre}</p>
          {employee.puesto && <p className="break-words text-xs text-muted-foreground">{employee.puesto}</p>}
          {employee.estatus === "no_aplica" && employee.motivoNoAplica && (
            <p className="text-xs text-muted-foreground">No elegible para este semestre.</p>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <EmployeeStatus employee={employee} />
          {hasEvaluation && employee.calificacionFinal != null && (
            <span className="text-sm font-medium tabular-nums">{employee.calificacionFinal}%</span>
          )}
          {hasEvaluation && !isReadOnly && (
            <div className="flex min-h-11 items-center gap-2">
              <Switch id={`physical-${employee.id}`} checked={employee.fisicoEntregado} disabled={saving} onCheckedChange={(checked) => onPhysical(employee.numero, checked)} aria-label={`Formato físico recibido de ${employee.nombre}`} />
              <label htmlFor={`physical-${employee.id}`} className="cursor-pointer whitespace-nowrap text-sm text-muted-foreground">Físico recibido</label>
            </div>
          )}
          {hasEvaluation && isReadOnly && (
            <span className="text-xs text-muted-foreground">Físico {employee.fisicoEntregado ? "recibido" : "pendiente"}</span>
          )}
          {canMarkManual && !isReadOnly && (
            <div className="flex min-h-11 items-center">
              {pendingManual === null ? (
                <Switch checked={employee.estatus === "manual"} disabled={saving} onCheckedChange={setPendingManual} aria-label={`${employee.estatus === "manual" ? "Quitar" : "Registrar"} entrega manual de ${employee.nombre}`} />
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11"
                  autoFocus
                  disabled={saving}
                  onClick={confirmManual}
                  onBlur={() => setPendingManual(null)}
                  onKeyDown={(event) => { if (event.key === "Escape") setPendingManual(null) }}
                  aria-label={`Confirmar ${pendingManual ? "entrega manual" : "retiro de entrega manual"} de ${employee.nombre}`}
                >
                  Confirmar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function Department({
  group,
  expanded,
  onToggle,
  saving,
  isReadOnly,
  onManual,
  onPhysical,
}: {
  group: DeptCumplimiento
  expanded: boolean
  onToggle: () => void
  saving: boolean
  isReadOnly: boolean
  onManual: (numero: string, checked: boolean, fechaIngreso: string | null) => void
  onPhysical: (numero: string, checked: boolean) => void
}) {
  const Icon = expanded ? ChevronDown : ChevronRight
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{group.departamento}</span>
          <span className="block text-xs text-muted-foreground">{group.entregadas} de {group.total} entregadas · {group.fisicos} físicos recibidos</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Progress value={group.porcentajeEntregadas} className="w-20 sm:w-28" aria-hidden="true" />
          <span className="min-w-8 text-right text-sm font-medium tabular-nums">{group.porcentajeEntregadas}%</span>
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border p-3 sm:p-4">
          <ul className="grid min-w-0 gap-2 lg:grid-cols-2">
            {group.empleados.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} saving={saving} isReadOnly={isReadOnly} onManual={onManual} onPhysical={onPhysical} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export default function DesempenoCumplimientoContent() {
  const { isReadOnly } = useRole()
  const [mode, setMode] = useState<PeriodoModo>("semestrales")
  const periodo = getPeriodoActual(mode)
  const { loading, saving, error, deptGroups, resumen, marcarEntrega, marcarFisico } = useCumplimientoDesempeno(periodo)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const delivery = mode === "semestrales" ? getVentanaEntrega(periodo) : null

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX")
    return deptGroups.map((group) => ({
      ...group,
      empleados: group.empleados.filter((employee) => {
        const matchesQuery = !query || [employee.nombre, employee.numero, employee.puesto, employee.area]
          .some((value) => value?.toLocaleLowerCase("es-MX").includes(query))
        const matchesStatus = statusFilter === "all"
          || (statusFilter === "entregada" && (employee.estatus === "auto" || employee.estatus === "manual"))
          || (statusFilter !== "entregada" && employee.estatus === statusFilter)
        return matchesQuery && matchesStatus
      }),
    })).filter((group) => group.empleados.length > 0)
  }, [deptGroups, search, statusFilter])

  const filtersActive = Boolean(search.trim() || statusFilter !== "all")

  return (
    <div className="min-w-0 space-y-6">
      {isReadOnly && <ReadOnlyBanner />}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Periodo asignado automáticamente</p>
            <p className="text-base font-semibold">{periodo}</p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-muted p-1" role="group" aria-label="Modalidad de evaluación">
            <Button size="sm" variant={mode === "semestrales" ? "outline" : "ghost"} className="min-h-10" aria-pressed={mode === "semestrales"} disabled={saving} onClick={() => setMode("semestrales")}>Semestral</Button>
            <Button size="sm" variant={mode === "mensuales" ? "outline" : "ghost"} className="min-h-10" aria-pressed={mode === "mensuales"} disabled={saving} onClick={() => setMode("mensuales")}>Mensual</Button>
          </div>
        </CardContent>
      </Card>

      {delivery && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <div>
            <p className="font-medium">Recepción de formatos físicos · {delivery.estado}</p>
            <p className="text-xs text-muted-foreground">{dateFormatter.format(delivery.inicio)} – {dateFormatter.format(delivery.fin)}</p>
          </div>
          <span className="text-xs text-muted-foreground">Periodo {periodo}</span>
        </div>
      )}

      <section aria-label="Resumen de cumplimiento" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Personas" value={resumen.total} detail="En este periodo" loading={loading} />
        <Metric label="Entregadas" value={resumen.entregadas} detail={`${resumen.porcentajeEntregadas}% del total`} loading={loading} />
        <Metric label="Pendientes" value={resumen.total - resumen.entregadas} detail="Sin evaluación o entrega" loading={loading} />
        <Metric label="Físicos recibidos" value={resumen.fisicos} detail={`${resumen.porcentaje}% del total`} loading={loading} />
      </section>

      <section className="space-y-4" aria-labelledby="cumplimiento-departamentos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cumplimiento-departamentos" className="text-base font-semibold tracking-tight">Por departamento</h2>
            <p className="text-sm text-muted-foreground">{isReadOnly ? "Consulta el estado de cada persona." : "Activa el interruptor junto al estado y confirma para registrar una entrega manual."}</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar por nombre, número, puesto o área" placeholder="Buscar persona…" className="h-11 pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-11 w-full sm:w-40" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entregada">Entregadas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="no_aplica">No aplica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        {loading ? (
          <div className="space-y-2" aria-label="Cargando departamentos">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {filtersActive ? "No hay personas que coincidan con los filtros." : "No hay personas para este periodo."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleGroups.map((group) => (
              <Department
                key={`${periodo}:${group.departamento}`}
                group={group}
                expanded={expanded[group.departamento] ?? filtersActive}
                onToggle={() => setExpanded((current) => ({ ...current, [group.departamento]: !(current[group.departamento] ?? filtersActive) }))}
                saving={saving}
                isReadOnly={isReadOnly}
                onManual={(numero, checked, fechaIngreso) => void marcarEntrega(numero, checked, { fechaIngreso })}
                onPhysical={(numero, checked) => void marcarFisico(numero, checked)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
