"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search, CheckCircle2, AlertCircle, Clock, AlertTriangle,
  XCircle, CalendarCheck, Info, UserPlus, X, CalendarDays, FileUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { useNuevoIngreso, formatDate, daysFromToday, evalStatus, useRole } from "@/lib/hooks"
import type { NuevoIngreso, NuevoIngresoUpdate, EvalStatus } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { EditEmployeeDialog } from "@/components/content/edit-employee-dialog"
import { CreateEmployeeDialog } from "@/components/content/create-employee-dialog"
import { IncidenciasModal } from "@/components/content/incidencias-modal"
import { IncidenciasBulkImport } from "@/components/content/incidencias-bulk-import"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

const EVAL_STATUS_META: Record<EvalStatus, { label: string; icon: React.ElementType; classes: string }> = {
  completada: { label: 'Completada', icon: CheckCircle2, classes: 'text-success' },
  proxima: { label: 'Próxima', icon: AlertTriangle, classes: 'text-warning' },
  hoy: { label: 'Hoy', icon: CalendarCheck, classes: 'text-warning' },
  vencida: { label: 'Vencida', icon: XCircle, classes: 'text-destructive' },
  pendiente: { label: 'Pendiente', icon: Clock, classes: 'text-muted-foreground' },
}

function EvalBadge({ fecha, calificacion }: { fecha: string | null; calificacion: number | null }) {
  const status = evalStatus(fecha, calificacion)
  const { icon: Icon, classes } = EVAL_STATUS_META[status]
  const diff = daysFromToday(fecha)

  return (
    <div className={`flex flex-col items-center gap-0.5 ${classes}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{formatDate(fecha)}</span>
      {calificacion != null && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${calificacion >= 70 ? 'bg-success/10 text-success'
          : 'bg-destructive/10 text-destructive'
          }`}>{calificacion}</span>
      )}
      {calificacion == null && diff !== null && diff >= 0 && (
        <span className="text-xs opacity-70">{diff === 0 ? 'hoy' : `en ${diff}d`}</span>
      )}
      {calificacion == null && diff !== null && diff < 0 && (
        <span className="text-xs opacity-70">{Math.abs(diff)}d atrás</span>
      )}
    </div>
  )
}

function ContratoTerminoBadge({ fecha, indeterminado }: { fecha: string | null; indeterminado?: boolean }) {
  const diff = daysFromToday(fecha)
  if (diff === null) return <span className="text-xs text-muted-foreground">—</span>
  const urgent = diff <= 10
  const past = diff < 0
  return (
    <div className={`text-xs font-medium ${past && !indeterminado ? 'text-destructive' : urgent && !indeterminado ? 'text-warning' : 'text-muted-foreground'}`}>
      <div>{formatDate(fecha)}</div>
      {!indeterminado && (
        <div className="opacity-70">
          {past ? `Vencido hace ${Math.abs(diff)}d` : diff === 0 ? 'Hoy' : `En ${diff} días`}
        </div>
      )}
    </div>
  )
}



export default function NuevoIngresoContent() {
  const { isReadOnly } = useRole()
  const { loading, saving, error, fetchAll, updateRecord, deleteRecord, createRecord } = useNuevoIngreso()

  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterContrato, setFilterContrato] = useState('all')
  const [filterRG, setFilterRG] = useState('all')
  const [filterTurno, setFilterTurno] = useState('all')
  const [editRecord, setEditRecord] = useState<NuevoIngreso | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Nuevo empleado dialog
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)

  // Incidencias modal
  const [incidenciasOpen, setIncidenciasOpen] = useState(false)
  const [incidenciasEmpleado, setIncidenciasEmpleado] = useState<{ numero: string; nombre: string } | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const handleOpenIncidencias = (r: NuevoIngreso) => {
    if (!r.numero) return
    setIncidenciasEmpleado({ numero: r.numero, nombre: r.nombre })
    setIncidenciasOpen(true)
  }

  // Map numero → nombre for bulk import preview
  const employeeNames = useMemo(() => {
    const map: Record<string, string> = {}
    records.forEach(r => { if (r.numero) map[r.numero] = r.nombre })
    return map
  }, [records])

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])

  useEffect(() => { load() }, [load])

  // Opciones únicas para filtros
  const departments = Array.from(new Set(records.map(r => r.departamento).filter(Boolean))).sort() as string[]
  const turnos = Array.from(new Set(records.map(r => r.turno).filter(Boolean))).sort() as string[]

  // Filtrado
  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      r.nombre.toLowerCase().includes(q) ||
      (r.numero ?? '').toLowerCase().includes(q) ||
      (r.puesto ?? '').toLowerCase().includes(q) ||
      (r.departamento ?? '').toLowerCase().includes(q) ||
      (r.area ?? '').toLowerCase().includes(q) ||
      (r.curp ?? '').toLowerCase().includes(q) ||
      (r.jefe_area ?? '').toLowerCase().includes(q) ||
      (r.turno ?? '').toLowerCase().includes(q)
    const matchDept = filterDept === 'all' || r.departamento === filterDept
    const matchContrato = filterContrato === 'all' || r.tipo_contrato === filterContrato
    const matchRG = filterRG === 'all' || r.rg_rec_048 === filterRG
    const matchTurno = filterTurno === 'all' || r.turno === filterTurno
    return matchSearch && matchDept && matchContrato && matchRG && matchTurno
  }).sort((a, b) => {
    const na = a.numero ? parseInt(a.numero, 10) : Infinity
    const nb = b.numero ? parseInt(b.numero, 10) : Infinity
    if (isNaN(na) && isNaN(nb)) return (a.numero ?? '').localeCompare(b.numero ?? '')
    if (isNaN(na)) return 1
    if (isNaN(nb)) return -1
    return na - nb
  })

  // Paginación
  const PAGE_SIZE = 15
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedFiltered = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset página al cambiar filtros
  useEffect(() => { setCurrentPage(1) }, [search, filterDept, filterContrato, filterRG, filterTurno])


  const handleEdit = (record: NuevoIngreso) => {
    setEditRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (id: string, updates: NuevoIngresoUpdate) => {
    const result = await updateRecord(id, updates)
    if (result.success) {
      setEditOpen(false)
      setEditRecord(null)
      load()
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteRecord(id)
    if (result.success) {
      setEditOpen(false)
      setEditRecord(null)
      load()
    }
  }

  const handleCreate = async (data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createRecord(data)
    if (result.success) {
      setNuevoOpen(false)
      setCreateSuccess(true)
      load()
      setTimeout(() => setCreateSuccess(false), 4000)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <ReadOnlyBanner />

      {/* Alertas */}
      {createSuccess && (
        <Alert className="mb-4 border-success/30 bg-success/10 text-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Empleado creado correctamente.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Card principal con header + filtros */}
      <Card className="bg-card mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle>Nuevo Ingreso</CardTitle>
              <CardDescription>Seguimiento de evaluaciones y documentación de empleados nuevos.</CardDescription>
            </div>
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="icon" variant="outline" onClick={() => setBulkImportOpen(true)} aria-label="Importar Incidencias" title="Importar Incidencias">
                  <FileUp className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={() => setNuevoOpen(true)} aria-label="Nuevo Empleado" title="Nuevo Empleado">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search — fila completa */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-9 bg-muted text-foreground ${search ? 'pr-9' : ''}`}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters — flex wrap, 2 por fila en móvil */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="flex-1 min-w-[140px] bg-muted text-foreground text-sm">
                <SelectValue placeholder="Departamentos" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Departamentos</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterContrato} onValueChange={setFilterContrato}>
              <SelectTrigger className="flex-1 min-w-[140px] bg-muted text-foreground text-sm">
                <SelectValue placeholder="Tipo contrato" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Tipo contrato</SelectItem>
                <SelectItem value="A prueba">A prueba</SelectItem>
                <SelectItem value="Indeterminado">Indeterminado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTurno} onValueChange={setFilterTurno}>
              <SelectTrigger className="flex-1 min-w-[140px] bg-muted text-foreground text-sm">
                <SelectValue placeholder="Turnos" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Turnos</SelectItem>
                {turnos.map(t => <SelectItem key={t} value={t}>Turno {t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRG} onValueChange={setFilterRG}>
              <SelectTrigger className="flex-1 min-w-[140px] bg-muted text-foreground text-sm">
                <SelectValue placeholder="Plan de Formación" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Plan de Formación</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Paginación superior */}
      {filtered.length > PAGE_SIZE && (
        <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Tabla */}
      <Card className="bg-card mb-6">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y" aria-busy="true" aria-label="Cargando empleados">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-16 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                  <Skeleton className="h-5 w-20 rounded-full hidden md:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {records.length === 0
                ? (isReadOnly
                    ? 'No hay empleados registrados.'
                    : 'No hay empleados registrados. Usa el botón “Nuevo Empleado” para crear el primero.')
                : 'Sin empleados que coincidan con el filtro.'}
            </div>
          ) : (
            <>
              {/* ── Móvil: tarjetas ──────────────────────────────────────── */}
              <div className="sm:hidden divide-y divide-border">
                {paginatedFiltered.map(r => {
                  const rgVencido = daysFromToday(r.fecha_vencimiento_rg)
                  const rgUrgente = r.rg_rec_048 === 'Pendiente' && rgVencido !== null && rgVencido <= 7
                  return (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Editar empleado ${r.nombre}`}
                      className="p-4 cursor-pointer active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      onClick={() => handleEdit(r)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleEdit(r)
                        }
                      }}
                    >
                      {/* Fila superior: nombre + RG pill */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {r.numero && (
                            <p className="text-[11px] font-mono text-muted-foreground leading-none mb-0.5">
                              #{r.numero}
                            </p>
                          )}
                          <p className="font-semibold text-sm leading-tight">{r.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.puesto}</p>
                          <p className="text-xs text-muted-foreground">{r.departamento}</p>
                        </div>
                        <div className={`shrink-0 inline-flex flex-col items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${r.rg_rec_048 === 'Entregado'
                          ? 'bg-success/10 text-success'
                          : rgUrgente
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                          }`}>
                          <span className="flex items-center gap-1">
                            {r.rg_rec_048 === 'Entregado' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            RG
                          </span>
                          {r.fecha_vencimiento_rg && (
                            <span className="text-[11px] opacity-80">{formatDate(r.fecha_vencimiento_rg)}</span>
                          )}
                        </div>
                        {/* Incidencias button */}
                        {r.numero && (
                          <button
                            type="button"
                            aria-label={`Incidencias de ${r.nombre}`}
                            onClick={(e) => { e.stopPropagation(); handleOpenIncidencias(r) }}
                            className="shrink-0 p-1.5 rounded-md bg-info/10 text-info hover:bg-info/20 transition-colors"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[11px] text-muted-foreground">1er mes</span>
                          <EvalBadge fecha={r.eval_1_fecha} calificacion={r.eval_1_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[11px] text-muted-foreground">2do mes</span>
                          <EvalBadge fecha={r.eval_2_fecha} calificacion={r.eval_2_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[11px] text-muted-foreground">3er mes</span>
                          <EvalBadge fecha={r.eval_3_fecha} calificacion={r.eval_3_calificacion} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Desktop: tabla ───────────────────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/50">
                      <TableHead className="w-[90px]">N.N</TableHead>
                      <TableHead className="min-w-[180px]">Empleado</TableHead>
                      <TableHead className="hidden md:table-cell">Ingreso</TableHead>
                      <TableHead className="text-center">Eval. 1er mes</TableHead>
                      <TableHead className="text-center hidden md:table-cell">Eval. 2do mes</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Eval. 3er mes</TableHead>
                      <TableHead className="hidden md:table-cell">Término</TableHead>
                      <TableHead className="hidden md:table-cell">Contrato</TableHead>
                      <TableHead className="text-center">RG-REC-048</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFiltered.map(r => {
                      const rgVencido = daysFromToday(r.fecha_vencimiento_rg)
                      const rgUrgente = r.rg_rec_048 === 'Pendiente' && rgVencido !== null && rgVencido <= 7
                      return (
                        <TableRow
                          key={r.id}
                          className="hover:bg-muted/40 cursor-pointer"
                          onClick={() => handleEdit(r)}
                        >
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              {r.numero ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm leading-tight">{r.nombre}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">{r.puesto}</span>
                              {r.turno && (
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground whitespace-nowrap">
                                  T{r.turno}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">{formatDate(r.fecha_ingreso)}</div>
                            <div className="text-xs text-muted-foreground">{r.departamento}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <EvalBadge fecha={r.eval_1_fecha} calificacion={r.eval_1_calificacion} />
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <EvalBadge fecha={r.eval_2_fecha} calificacion={r.eval_2_calificacion} />
                          </TableCell>
                          <TableCell className="text-center hidden lg:table-cell">
                            <EvalBadge fecha={r.eval_3_fecha} calificacion={r.eval_3_calificacion} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <ContratoTerminoBadge fecha={r.termino_contrato} indeterminado={r.tipo_contrato === 'Indeterminado'} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant={r.tipo_contrato === 'Indeterminado' ? 'info' : 'secondary'}
                              className="whitespace-nowrap"
                            >
                              {r.tipo_contrato}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex flex-col items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${r.rg_rec_048 === 'Entregado'
                              ? 'bg-success/10 text-success'
                              : rgUrgente
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-warning/10 text-warning'
                              }`}>
                              <span className="flex items-center gap-1">
                                {r.rg_rec_048 === 'Entregado' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {r.rg_rec_048 === 'Entregado' ? 'Entregado' : 'Pendiente'}
                              </span>
                              {r.fecha_vencimiento_rg && (
                                <span className="text-[11px] opacity-80">{formatDate(r.fecha_vencimiento_rg)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.numero && (
                              <button
                                type="button"
                                aria-label={`Incidencias de ${r.nombre}`}
                                onClick={(e) => { e.stopPropagation(); handleOpenIncidencias(r) }}
                                className="p-1.5 rounded-md bg-info/10 text-info hover:bg-info/20 transition-colors"
                                title="Incidencias"
                              >
                                <CalendarDays className="h-4 w-4" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mb-6">
        {filtered.length} de {records.length} empleados
      </p>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          <span>Haz clic en una fila para editar calificaciones y estado</span>
        </div>
        {Object.entries(EVAL_STATUS_META).map(([key, { label, icon: Icon, classes }]) => (
          <div key={key} className="flex items-center gap-1">
            <Icon className={`h-3.5 w-3.5 ${classes}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Dialog de creación de nuevo empleado */}
      <CreateEmployeeDialog
        open={nuevoOpen}
        saving={saving}
        onClose={() => setNuevoOpen(false)}
        onCreate={handleCreate}
      />

      {/* Dialog de edición */}
      {/* Incidencias modal */}
      {incidenciasEmpleado && (
        <IncidenciasModal
          open={incidenciasOpen}
          onClose={() => { setIncidenciasOpen(false); setIncidenciasEmpleado(null) }}
          numeroEmpleado={incidenciasEmpleado.numero}
          nombreEmpleado={incidenciasEmpleado.nombre}
        />
      )}

      <EditEmployeeDialog
        record={editRecord}
        open={editOpen}
        saving={saving}
        onClose={() => { setEditOpen(false); setEditRecord(null) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Bulk import incidencias */}
      <IncidenciasBulkImport
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        employeeNames={employeeNames}
      />
    </>
  )
}
