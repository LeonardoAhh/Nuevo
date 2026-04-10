"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Search, CheckCircle2, AlertCircle, Clock, AlertTriangle,
  XCircle, Pencil, CalendarCheck, Info, UserPlus, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { useNuevoIngreso, formatDate, daysFromToday, evalStatus, addDays, useRole } from "@/lib/hooks"
import type { NuevoIngreso, NuevoIngresoUpdate, TipoContrato, EstadoRG, EvalStatus } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { CATALOGO_ORGANIZACIONAL, TURNOS, JEFES_DE_AREA, ESCOLARIDAD } from "@/lib/catalogo"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

const EVAL_STATUS_META: Record<EvalStatus, { label: string; icon: React.ElementType; classes: string }> = {
  completada: { label: 'Completada', icon: CheckCircle2, classes: 'text-green-600 dark:text-green-400' },
  proxima: { label: 'Próxima', icon: AlertTriangle, classes: 'text-yellow-500 dark:text-yellow-400' },
  hoy: { label: 'Hoy', icon: CalendarCheck, classes: 'text-orange-500 dark:text-orange-400' },
  vencida: { label: 'Vencida', icon: XCircle, classes: 'text-destructive dark:text-red-400' },
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
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${calificacion >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
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

function ContratoTerminoBadge({ fecha }: { fecha: string | null }) {
  const diff = daysFromToday(fecha)
  if (diff === null) return <span className="text-xs text-gray-400">—</span>
  const urgent = diff <= 10
  const past = diff < 0
  return (
    <div className={`text-xs font-medium ${past ? 'text-destructive' : urgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
      <div>{formatDate(fecha)}</div>
      <div className="opacity-70">
        {past ? `Vencido hace ${Math.abs(diff)}d` : diff === 0 ? 'Hoy' : `En ${diff} días`}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog de edición (existente)
// ─────────────────────────────────────────────────────────────────────────────

interface EditDialogProps {
  record: NuevoIngreso | null
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (id: string, updates: NuevoIngresoUpdate) => Promise<void>
}

function EditDialog({ record, open, saving, onClose, onSave }: EditDialogProps) {
  const [form, setForm] = useState<NuevoIngresoUpdate>({})

  useEffect(() => {
    if (record) {
      setForm({
        escolaridad: record.escolaridad ?? '',
        eval_1_calificacion: record.eval_1_calificacion ?? undefined,
        eval_2_calificacion: record.eval_2_calificacion ?? undefined,
        eval_3_calificacion: record.eval_3_calificacion ?? undefined,
        tipo_contrato: record.tipo_contrato,
        rg_rec_048: record.rg_rec_048,
      })
    }
  }, [record])

  if (!record) return null

  const set = (key: keyof NuevoIngresoUpdate, value: any) =>
    setForm(prev => ({ ...prev, [key]: value === '' ? null : value }))

  const handleSave = () => onSave(record.id, form)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className=" flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            {record.nombre}
          </DialogTitle>
          <DialogDescription className="">
            {record.puesto} · {record.departamento} · Ingreso: {formatDate(record.fecha_ingreso)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Escolaridad</label>
            <Input
              value={form.escolaridad ?? ''}
              onChange={e => set('escolaridad', e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { label: '1er mes', key: 'eval_1_calificacion' as const, fecha: record.eval_1_fecha },
              { label: '2do mes', key: 'eval_2_calificacion' as const, fecha: record.eval_2_fecha },
              { label: '3er mes', key: 'eval_3_calificacion' as const, fecha: record.eval_3_fecha },
            ]).map(({ label, key, fecha }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium">
                  Eval. {label}
                  <span className="block text-gray-400 font-normal">{formatDate(fecha)}</span>
                </label>
                <Input
                  type="number" min={0} max={100}
                  value={form[key] ?? ''}
                  onChange={e => set(key, e.target.value === '' ? null : parseInt(e.target.value))}
                  className="text-base md:text-sm bg-muted"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de contrato</label>
            <Select value={form.tipo_contrato ?? record.tipo_contrato} onValueChange={v => set('tipo_contrato', v as TipoContrato)}>
              <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="A prueba">A prueba</SelectItem>
                <SelectItem value="Indeterminado">Indeterminado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              RG-REC-048
              <span className="ml-2 text-xs font-normal text-gray-400">Vence: {formatDate(record.fecha_vencimiento_rg)}</span>
            </label>
            <Select value={form.rg_rec_048 ?? record.rg_rec_048} onValueChange={v => set('rg_rec_048', v as EstadoRG)}>
              <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</> : <><CheckCircle2 className="h-4 w-4" /> Guardar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog de creación de nuevo empleado
// ─────────────────────────────────────────────────────────────────────────────

interface NuevoEmpleadoForm {
  numero: string
  nombre: string
  puesto: string
  departamento: string
  area: string
  turno: string
  fecha_ingreso: string
  curp: string
  escolaridad: string
  jefe_area: string
  tipo_contrato: TipoContrato
}

const FORM_INICIAL: NuevoEmpleadoForm = {
  numero: '', nombre: '', puesto: '', departamento: '', area: '',
  turno: '', fecha_ingreso: new Date().toISOString().split('T')[0],
  curp: '', escolaridad: '', jefe_area: '',
  tipo_contrato: 'A prueba',
}

// Campo de formulario reutilizable — definido en el módulo para evitar re-creación en cada render
function FormField({
  id, label, required = false, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

interface NuevoEmpleadoDialogProps {
  open: boolean
  saving: boolean
  onClose: () => void
  onCreate: (data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

function NuevoEmpleadoDialog({ open, saving, onClose, onCreate }: NuevoEmpleadoDialogProps) {
  const [form, setForm] = useState<NuevoEmpleadoForm>(FORM_INICIAL)
  const [formError, setFormError] = useState<string | null>(null)

  // Resetear al abrir
  useEffect(() => {
    if (open) { setForm(FORM_INICIAL); setFormError(null) }
  }, [open])

  const set = (key: keyof NuevoEmpleadoForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const departamentos = Object.keys(CATALOGO_ORGANIZACIONAL)
  const areasDisponibles = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas || []) : []
  const puestosDisponibles = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos || []) : []

  const setDepartamento = (v: string) => {
    setForm(prev => ({
      ...prev,
      departamento: v,
      area: '',
      puesto: ''
    }))
  }

  const handleCreate = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return }
    if (!form.departamento) { setFormError('El departamento es obligatorio.'); return }
    if (!form.area) { setFormError('El área es obligatoria.'); return }
    if (!form.puesto) { setFormError('El puesto es obligatorio.'); return }
    if (!form.turno) { setFormError('El turno es obligatorio.'); return }
    if (!form.fecha_ingreso.trim()) { setFormError('La fecha de ingreso es obligatoria.'); return }
    setFormError(null)

    const fi = form.fecha_ingreso
    const data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'> = {
      numero: form.numero.trim() || null,
      nombre: form.nombre.trim().toUpperCase(),
      puesto: form.puesto.trim() || null,
      departamento: form.departamento.trim() || null,
      area: form.area.trim() || null,
      turno: form.turno.trim() || null,
      fecha_ingreso: fi,
      curp: form.curp.trim() || null,
      escolaridad: form.escolaridad.trim() || null,
      jefe_area: form.jefe_area.trim() || null,
      eval_1_fecha: addDays(fi, 30),
      eval_1_calificacion: null,
      eval_2_fecha: addDays(fi, 60),
      eval_2_calificacion: null,
      eval_3_fecha: addDays(fi, 80),
      eval_3_calificacion: null,
      termino_contrato: addDays(fi, 90),
      tipo_contrato: form.tipo_contrato,
      rg_rec_048: 'Pendiente',
      fecha_vencimiento_rg: addDays(fi, 91),
    }
    await onCreate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className=" flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-500" />
            Nuevo Empleado
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para registrar a un nuevo trabajador en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Fila 1: N.N + Nombre */}
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <FormField id="numero" label="N.N">
              <Input id="numero" value={form.numero}
                onChange={e => set('numero', e.target.value)}
                placeholder="001"
                className="bg-muted" />
            </FormField>
            <FormField id="nombre" label="Nombre completo" required>
              <Input id="nombre" value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="PÉREZ GARCÍA JUAN"
                className="bg-muted" />
            </FormField>
          </div>

          {/* Fila 2: Departamento + Área */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="departamento" label="Departamento" required>
              <Select value={form.departamento} onValueChange={setDepartamento}>
                <SelectTrigger id="departamento" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="area" label="Área" required>
              <Select value={form.area} onValueChange={v => set('area', v)} disabled={!form.departamento}>
                <SelectTrigger id="area" className="bg-muted">
                  <SelectValue placeholder={form.departamento ? "Selecciona..." : "Elige depto primero"} />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {areasDisponibles.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Fila 3: Puesto + Turno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="puesto" label="Puesto" required>
              <Select value={form.puesto} onValueChange={v => set('puesto', v)} disabled={!form.departamento}>
                <SelectTrigger id="puesto" className="bg-muted">
                  <SelectValue placeholder={form.departamento ? "Selecciona..." : "Elige depto primero"} />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {puestosDisponibles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="turno" label="Turno" required>
              <Select value={form.turno} onValueChange={v => set('turno', v)}>
                <SelectTrigger id="turno" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Fila 4: Fecha ingreso + Tipo contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="fecha_ingreso" label="Fecha de ingreso" required>
              <Input id="fecha_ingreso" type="date"
                value={form.fecha_ingreso}
                onChange={e => set('fecha_ingreso', e.target.value)}
                className="text-base md:text-sm bg-muted" />
            </FormField>
            <FormField id="tipo_contrato" label="Tipo de contrato">
              <Select value={form.tipo_contrato} onValueChange={v => set('tipo_contrato', v as TipoContrato)}>
                <SelectTrigger id="tipo_contrato" className="bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="A prueba">A prueba</SelectItem>
                  <SelectItem value="Indeterminado">Indeterminado</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Fila 5: CURP + Escolaridad + Jefe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField id="curp" label="CURP">
              <Input id="curp" value={form.curp}
                onChange={e => set('curp', e.target.value.toUpperCase())}
                placeholder="PELJ900101HDFRZN09"
                className="bg-muted" />
            </FormField>
            <FormField id="escolaridad" label="Escolaridad">
              <Select value={form.escolaridad} onValueChange={v => set('escolaridad', v)}>
                <SelectTrigger id="escolaridad" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {ESCOLARIDAD.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="jefe_area" label="Jefe de área">
              <Select value={form.jefe_area} onValueChange={v => set('jefe_area', v)}>
                <SelectTrigger id="jefe_area" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {JEFES_DE_AREA.map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Preview fechas calculadas */}
          {form.fecha_ingreso && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Fechas calculadas automáticamente</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Eval. 1er mes', days: 30 },
                  { label: 'Eval. 2o mes', days: 60 },
                  { label: 'Eval. 3er mes', days: 80 },
                  { label: 'Término / RG', days: 90 },
                ].map(({ label, days }) => (
                  <div key={label} className="text-center">
                    <p className="text-amber-600 dark:text-amber-500 font-medium">{label}</p>
                    <p className="text-muted-foreground">{formatDate(addDays(form.fecha_ingreso, days))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="gap-2">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving || !form.nombre.trim()} className="gap-2">
            {saving
              ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</>
              : <><UserPlus className="h-4 w-4" /> Crear Empleado</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function NuevoIngresoContent() {
  const { isReadOnly } = useRole()
  const { loading, saving, error, fetchAll, updateRecord, createRecord } = useNuevoIngreso()

  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterContrato, setFilterContrato] = useState('all')
  const [filterRG, setFilterRG] = useState('all')
  const [filterTurno, setFilterTurno] = useState('all')
  const [editRecord, setEditRecord] = useState<NuevoIngreso | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Nuevo empleado dialog
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [])

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

  // KPIs
  const today = new Date()
  const todayISO = today.toISOString().split('T')[0]
  const evalsPendientes = records.filter(r =>
    evalStatus(r.eval_1_fecha, r.eval_1_calificacion) !== 'completada' ||
    evalStatus(r.eval_2_fecha, r.eval_2_calificacion) !== 'completada' ||
    evalStatus(r.eval_3_fecha, r.eval_3_calificacion) !== 'completada'
  ).length
  const contratosPorVencer = records.filter(r => {
    const diff = daysFromToday(r.termino_contrato)
    return diff !== null && diff >= 0 && diff <= 15
  }).length
  const rgPendientes = records.filter(r => r.rg_rec_048 === 'Pendiente').length

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
      <div className="flex justify-end mb-6">
        <Button
          size="sm"
          className="gap-2"
          disabled={isReadOnly}
          onClick={() => setNuevoOpen(true)}
        >
          <UserPlus className="h-4 w-4" /> Nuevo Empleado
        </Button>
      </div>

      {/* Alertas */}
      {createSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
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

      {/* Filtros */}
      <div className="space-y-2 mb-4">
        {/* Búsqueda — fila completa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder=""
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted"
          />
        </div>
        {/* Selects — 2 columnas en móvil, fila en desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Departamentos</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterContrato} onValueChange={setFilterContrato}>
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Tipo contrato</SelectItem>
              <SelectItem value="A prueba">A prueba</SelectItem>
              <SelectItem value="Indeterminado">Indeterminado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTurno} onValueChange={setFilterTurno}>
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Turnos</SelectItem>
              {turnos.map(t => <SelectItem key={t} value={t}>Turno {t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRG} onValueChange={setFilterRG}>
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Plan de Formación</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <Card className="bg-card mb-6">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {records.length === 0
                ? 'No hay registros. Usa el botón Importar para cargar el JSON.'
                : 'No se encontraron empleados con ese filtro.'}
            </div>
          ) : (
            <>
              {/* ── Móvil: tarjetas ──────────────────────────────────────── */}
              <div className="sm:hidden divide-y dark:divide-gray-700">
                {filtered.map(r => {
                  const rgVencido = daysFromToday(r.fecha_vencimiento_rg)
                  const rgUrgente = r.rg_rec_048 === 'Pendiente' && rgVencido !== null && rgVencido <= 7
                  return (
                    <div
                      key={r.id}
                      className="p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/40"
                      onClick={() => handleEdit(r)}
                    >
                      {/* Fila superior: nombre + RG pill */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {r.numero && (
                            <p className="text-[10px] font-mono text-muted-foreground leading-none mb-0.5">
                              #{r.numero}
                            </p>
                          )}
                          <p className="font-semibold text-sm leading-tight">{r.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.puesto}</p>
                          <p className="text-xs text-muted-foreground">{r.departamento}</p>
                        </div>
                        <div className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${r.rg_rec_048 === 'Entregado'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : rgUrgente
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                          }`}>
                          {r.rg_rec_048 === 'Entregado' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          RG
                        </div>
                      </div>
                      {/* Fila inferior: 3 evaluaciones en línea */}
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground">1er mes</span>
                          <EvalBadge fecha={r.eval_1_fecha} calificacion={r.eval_1_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground">2do mes</span>
                          <EvalBadge fecha={r.eval_2_fecha} calificacion={r.eval_2_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground">3er mes</span>
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
                    <TableRow className=" bg-background/50">
                      <TableHead className=" w-[90px]">N.N</TableHead>
                      <TableHead className=" min-w-[180px]">Empleado</TableHead>
                      <TableHead className=" hidden md:table-cell">Ingreso</TableHead>
                      <TableHead className=" text-center">Eval. 1er mes</TableHead>
                      <TableHead className=" text-center hidden md:table-cell">Eval. 2do mes</TableHead>
                      <TableHead className=" text-center hidden lg:table-cell">Eval. 3er mes</TableHead>
                      <TableHead className=" hidden md:table-cell">Término</TableHead>
                      <TableHead className=" hidden md:table-cell">Contrato</TableHead>
                      <TableHead className=" text-center">RG-REC-048</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => {
                      const rgVencido = daysFromToday(r.fecha_vencimiento_rg)
                      const rgUrgente = r.rg_rec_048 === 'Pendiente' && rgVencido !== null && rgVencido <= 7
                      return (
                        <TableRow
                          key={r.id}
                          className=" hover:bg-muted/40 cursor-pointer"
                          onClick={() => handleEdit(r)}
                        >
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              {r.numero ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm leading-tight">{r.nombre}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.puesto}</div>
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
                            <ContratoTerminoBadge fecha={r.termino_contrato} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant={r.tipo_contrato === 'Indeterminado' ? 'default' : 'secondary'}
                              className={`text-xs whitespace-nowrap ${r.tipo_contrato === 'Indeterminado'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-muted'
                                }`}
                            >
                              {r.tipo_contrato}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${r.rg_rec_048 === 'Entregado'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : rgUrgente
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                              }`}>
                              {r.rg_rec_048 === 'Entregado' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {r.rg_rec_048}
                            </div>
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
      <NuevoEmpleadoDialog
        open={nuevoOpen}
        saving={saving}
        onClose={() => setNuevoOpen(false)}
        onCreate={handleCreate}
      />

      {/* Dialog de edición */}
      <EditDialog
        record={editRecord}
        open={editOpen}
        saving={saving}
        onClose={() => { setEditOpen(false); setEditRecord(null) }}
        onSave={handleSave}
      />
    </>
  )
}
