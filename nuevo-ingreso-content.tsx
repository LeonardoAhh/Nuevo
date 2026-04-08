"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, Upload, FileJson, RotateCcw, CheckCircle2,
  AlertCircle, Clock, AlertTriangle, ChevronRight,
  FileText, UserPlus, CalendarClock, XCircle, Pencil,
  CalendarCheck, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNuevoIngreso, formatDate, daysFromToday, evalStatus } from "@/lib/hooks"
import type { NuevoIngreso, NuevoIngresoUpdate, TipoContrato, EstadoRG, EvalStatus } from "@/lib/hooks"
import type { RawNuevoIngresoRecord } from "@/lib/hooks/useNuevoIngreso"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

const EVAL_STATUS_META: Record<EvalStatus, { label: string; icon: React.ElementType; classes: string }> = {
  completada: { label: 'Completada', icon: CheckCircle2,  classes: 'text-green-600 dark:text-green-400' },
  proxima:    { label: 'Próxima',    icon: AlertTriangle, classes: 'text-yellow-500 dark:text-yellow-400' },
  hoy:        { label: 'Hoy',        icon: CalendarCheck, classes: 'text-orange-500 dark:text-orange-400' },
  vencida:    { label: 'Vencida',    icon: XCircle,       classes: 'text-red-500 dark:text-red-400' },
  pendiente:  { label: 'Pendiente',  icon: Clock,         classes: 'text-gray-400 dark:text-gray-500' },
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
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
          calificacion >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
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
  const past   = diff < 0
  return (
    <div className={`text-xs font-medium ${past ? 'text-red-500' : urgent ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'}`}>
      <div>{formatDate(fecha)}</div>
      <div className="opacity-70">
        {past ? `Vencido hace ${Math.abs(diff)}d` : diff === 0 ? 'Hoy' : `En ${diff} días`}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog de edición
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
        escolaridad:         record.escolaridad ?? '',
        eval_1_calificacion: record.eval_1_calificacion ?? undefined,
        eval_2_calificacion: record.eval_2_calificacion ?? undefined,
        eval_3_calificacion: record.eval_3_calificacion ?? undefined,
        tipo_contrato:       record.tipo_contrato,
        rg_rec_048:          record.rg_rec_048,
      })
    }
  }, [record])

  if (!record) return null

  const set = (key: keyof NuevoIngresoUpdate, value: any) =>
    setForm(prev => ({ ...prev, [key]: value === '' ? null : value }))

  const handleSave = () => onSave(record.id, form)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            {record.nombre}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {record.puesto} · {record.departamento} · Ingreso: {formatDate(record.fecha_ingreso)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Escolaridad */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium dark:text-gray-200">Escolaridad</label>
            <Input
              value={form.escolaridad ?? ''}
              onChange={e => set('escolaridad', e.target.value)}
              placeholder=""
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Evaluaciones */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: '1er mes', key: 'eval_1_calificacion' as const, fecha: record.eval_1_fecha },
              { label: '2do mes', key: 'eval_2_calificacion' as const, fecha: record.eval_2_fecha },
              { label: '3er mes', key: 'eval_3_calificacion' as const, fecha: record.eval_3_fecha },
            ]).map(({ label, key, fecha }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium dark:text-gray-300">
                  Eval. {label}
                  <span className="block text-gray-400 font-normal">{formatDate(fecha)}</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form[key] ?? ''}
                  onChange={e => set(key, e.target.value === '' ? null : parseInt(e.target.value))}
                  placeholder=""
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            ))}
          </div>

          {/* Tipo contrato */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium dark:text-gray-200">Tipo de contrato</label>
            <Select
              value={form.tipo_contrato ?? record.tipo_contrato}
              onValueChange={v => set('tipo_contrato', v as TipoContrato)}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="A prueba">A prueba</SelectItem>
                <SelectItem value="Indeterminado">Indeterminado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RG-REC-048 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium dark:text-gray-200">
              RG-REC-048
              <span className="ml-2 text-xs font-normal text-gray-400">
                Vence: {formatDate(record.fecha_vencimiento_rg)}
              </span>
            </label>
            <Select
              value={form.rg_rec_048 ?? record.rg_rec_048}
              onValueChange={v => set('rg_rec_048', v as EstadoRG)}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}
            className="dark:border-gray-600 dark:text-gray-200">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving
              ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</>
              : <><CheckCircle2 className="h-4 w-4" /> Guardar</>}
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
  const { loading, saving, error, fetchAll, importRecords, updateRecord } = useNuevoIngreso()

  const [records, setRecords]           = useState<NuevoIngreso[]>([])
  const [search, setSearch]             = useState('')
  const [filterDept, setFilterDept]     = useState('all')
  const [filterContrato, setFilterContrato] = useState('all')
  const [filterRG, setFilterRG]         = useState('all')
  const [filterTurno, setFilterTurno]   = useState('all')
  const [editRecord, setEditRecord]     = useState<NuevoIngreso | null>(null)
  const [editOpen, setEditOpen]         = useState(false)

  // Import
  const [jsonText, setJsonText]         = useState('')
  const [parseError, setParseError]     = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importRef    = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [])

  useEffect(() => { load() }, [load])

  // Opciones únicas para filtros
  const departments = Array.from(new Set(records.map(r => r.departamento).filter(Boolean))).sort() as string[]
  const turnos      = Array.from(new Set(records.map(r => r.turno).filter(Boolean))).sort() as string[]

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
    const matchDept     = filterDept === 'all' || r.departamento === filterDept
    const matchContrato = filterContrato === 'all' || r.tipo_contrato === filterContrato
    const matchRG       = filterRG === 'all' || r.rg_rec_048 === filterRG
    const matchTurno    = filterTurno === 'all' || r.turno === filterTurno
    return matchSearch && matchDept && matchContrato && matchRG && matchTurno
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

  // Import handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setJsonText(ev.target?.result as string)
      setParseError(null)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImport = async () => {
    setParseError(null)
    try {
      const parsed = JSON.parse(jsonText)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) throw new Error('El JSON está vacío')
      const result = await importRecords(arr as RawNuevoIngresoRecord[])
      if (result.success) {
        setImportSuccess(true)
        setJsonText('')
        setShowImportForm(false)
        load()
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'JSON inválido')
    }
  }

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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Nuevo Ingreso</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Evaluaciones de desempeño y seguimiento de personal de nuevo ingreso
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 dark:border-gray-600 dark:text-gray-200 self-start sm:self-auto"
          onClick={() => {
            setShowImportForm(true)
            setImportSuccess(false)
            setTimeout(() => importRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
          }}
        >
          <Upload className="h-4 w-4" /> Importar
        </Button>
      </div>


      {/* Alertas */}
      {importSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Datos importados correctamente.
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
            className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        {/* Selects — 2 columnas en móvil, fila en desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Departamentos</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterContrato} onValueChange={setFilterContrato}>
            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Tipo contrato</SelectItem>
              <SelectItem value="A prueba">A prueba</SelectItem>
              <SelectItem value="Indeterminado">Indeterminado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTurno} onValueChange={setFilterTurno}>
            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Turnos</SelectItem>
              {turnos.map(t => <SelectItem key={t} value={t}>Turno {t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRG} onValueChange={setFilterRG}>
            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Plan de Formación</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
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
                          <p className="font-semibold text-sm dark:text-gray-200 leading-tight">{r.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{r.puesto}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{r.departamento}</p>
                        </div>
                        <div className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          r.rg_rec_048 === 'Entregado'
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
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">1er mes</span>
                          <EvalBadge fecha={r.eval_1_fecha} calificacion={r.eval_1_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">2do mes</span>
                          <EvalBadge fecha={r.eval_2_fecha} calificacion={r.eval_2_calificacion} />
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">3er mes</span>
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
                    <TableRow className="dark:border-gray-700 dark:bg-gray-900/50">
                      <TableHead className="dark:text-gray-400 min-w-[180px]">Empleado</TableHead>
                      <TableHead className="dark:text-gray-400 hidden md:table-cell">Ingreso</TableHead>
                      <TableHead className="dark:text-gray-400 text-center">Eval. 1er mes</TableHead>
                      <TableHead className="dark:text-gray-400 text-center hidden md:table-cell">Eval. 2do mes</TableHead>
                      <TableHead className="dark:text-gray-400 text-center hidden lg:table-cell">Eval. 3er mes</TableHead>
                      <TableHead className="dark:text-gray-400 hidden md:table-cell">Término</TableHead>
                      <TableHead className="dark:text-gray-400 hidden md:table-cell">Contrato</TableHead>
                      <TableHead className="dark:text-gray-400 text-center">RG-REC-048</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => {
                      const rgVencido = daysFromToday(r.fecha_vencimiento_rg)
                      const rgUrgente = r.rg_rec_048 === 'Pendiente' && rgVencido !== null && rgVencido <= 7
                      return (
                        <TableRow
                          key={r.id}
                          className="dark:border-gray-700 hover:dark:bg-gray-700/40 cursor-pointer"
                          onClick={() => handleEdit(r)}
                        >
                          <TableCell>
                            <div className="font-medium dark:text-gray-200 text-sm leading-tight">{r.nombre}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.puesto}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm dark:text-gray-300">{formatDate(r.fecha_ingreso)}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{r.departamento}</div>
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
                              className={`text-xs whitespace-nowrap ${
                                r.tipo_contrato === 'Indeterminado'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : 'dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {r.tipo_contrato}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              r.rg_rec_048 === 'Entregado'
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

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
        {filtered.length} de {records.length} empleados
      </p>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-6">
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

      {/* Formulario de importación */}
      {showImportForm && (
        <Card ref={importRef} className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="dark:text-white">Importar JSON</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Estructura con{' '}
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">Nombre</code>,{' '}
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">Fecha Ingreso</code>,{' '}
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">Tipo de Contrato</code>, etc.
                La fecha de ingreso puede ser número serial de Excel o DD/MM/YYYY.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowImportForm(false)}
              className="shrink-0 dark:text-gray-400">
              <XCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            <div
              className="border-2 border-dashed dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="h-10 w-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium dark:text-gray-200">Arrastra un archivo JSON o haz clic para seleccionar</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo archivos .json</p>
              <input ref={fileInputRef} type="file" accept=".json,application/json"
                onChange={handleFileUpload} className="hidden" />
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 dark:bg-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400">o pega el JSON</span>
              <Separator className="flex-1 dark:bg-gray-700" />
            </div>

            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setParseError(null) }}
              placeholder='[{ "N.N": "...", "Nombre": "...", "Fecha Ingreso": "46043", ... }]'
              rows={7}
              className="w-full rounded-xl border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setJsonText(''); setParseError(null); setShowImportForm(false) }}
                className="gap-2 dark:border-gray-600 dark:text-gray-200">
                <RotateCcw className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!jsonText.trim() || saving} className="gap-2">
                {saving
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Importando...</>
                  : <><Upload className="h-4 w-4" /> Importar</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
