"use client"

import { useState, useEffect, useCallback, useId, useRef, type ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle, ArrowLeft, CalendarClock, Check, ChevronDown,
  ChevronUp, FilePenLine, FileQuestion, Loader2, Plus, Trash2, X,
} from "lucide-react"
import {
  Dialog, DialogClose, DialogContent,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaginationBar } from "@/components/ui/pagination-bar"
import {
  useActasSeguimiento,
  ACTA_TIPOS, ACTA_ESTATUSES,
  type ActaSeguimiento, type ActaTipo, type ActaEstatus,
} from "@/lib/hooks/useActasSeguimiento"
import { useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import { supabase } from "@/lib/supabase/client"

const PAGE_SIZE = 10

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function sentenceCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLocaleLowerCase("es-MX")
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** Returns true if fecha_seguimiento is past today */
function isVencido(fecha: string | null): boolean {
  if (!fecha) return false
  return fecha < today()
}

/** Returns true if fecha_seguimiento is within 7 days */
function isProximo(fecha: string | null): boolean {
  if (!fecha) return false
  const diff = (new Date(fecha).getTime() - new Date(today()).getTime()) / 86_400_000
  return diff >= 0 && diff <= 7
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge helpers
// ─────────────────────────────────────────────────────────────────────────────

function EstatusBadge({ estatus }: { estatus: ActaEstatus }) {
  return (
    <Badge variant="outline" className={estatus === "CERRADO" ? "whitespace-nowrap border-border bg-muted/50 font-medium text-muted-foreground" : "whitespace-nowrap border-border bg-card font-medium text-foreground"}>
      {sentenceCase(estatus)}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Form blank state
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  tipo: ActaTipo
  fecha: string
  descripcion: string
  fecha_seguimiento: string
  estatus: ActaEstatus
}

function blankForm(): FormState {
  return {
    tipo: "ACTA ADMINISTRATIVA",
    fecha: today(),
    descripcion: "",
    fecha_seguimiento: "",
    estatus: "ACTIVO",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Row — collapsed card for a single record
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  acta: ActaSeguimiento
  canEdit: boolean
  onChangeEstatus: (id: string, estatus: ActaEstatus) => void
  onDelete: (id: string) => void
}

function ActaRow({ acta, canEdit, onChangeEstatus, onDelete }: RowProps) {
  const [open, setOpen] = useState(false)
  const vencido = isVencido(acta.fecha_seguimiento)
  const proximo = !vencido && isProximo(acta.fecha_seguimiento)
  const panelId = `acta-panel-${acta.id}`
  const tipoLabel = sentenceCase(acta.tipo)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_7rem_9rem_1rem] sm:gap-x-4"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{tipoLabel}</span>
          {!open && acta.descripcion && (
            <span className="mt-0.5 block truncate text-sm font-normal text-muted-foreground">{acta.descripcion}</span>
          )}
        </span>

        <span className="hidden items-center sm:flex">
          {!open && acta.fecha_seguimiento && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                vencido
                  ? "bg-destructive/10 text-destructive"
                  : proximo
                  ? "bg-warning/10 text-warning"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {vencido ? <AlertTriangle className="size-3.5" aria-hidden="true" /> : <CalendarClock className="size-3.5" aria-hidden="true" />}
              {formatDate(acta.fecha_seguimiento)}
            </span>
          )}
        </span>
        <span className="flex min-w-0 items-center">
          {(!open || !canEdit) && <EstatusBadge estatus={acta.estatus} />}
        </span>
        <span className="flex justify-end">
          {open
            ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            : <ChevronDown size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
          <div id={panelId} role="region">
            <div className="border-t border-border px-4 py-5">
              <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Fecha</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatDate(acta.fecha)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fecha de revisión</dt>
                  <dd className={`mt-1 flex items-center gap-1 font-medium ${vencido ? "text-destructive" : proximo ? "text-warning" : "text-foreground"}`}>
                    {formatDate(acta.fecha_seguimiento)}
                    {vencido && (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                        Vencido
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <dt className="text-muted-foreground">Descripción</dt>
                  <dd className="mt-1 max-w-prose whitespace-pre-line leading-5 text-foreground">
                    {acta.descripcion || "Sin descripción"}
                  </dd>
                </div>
              </dl>

              {/* Actions */}
              {canEdit && (
                <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">
                  <Select
                    value={acta.estatus}
                    onValueChange={v => onChangeEstatus(acta.id, v as ActaEstatus)}
                  >
                    <SelectTrigger
                      className="h-9 w-44 bg-card text-xs focus-visible:ring-offset-0"
                      aria-label="Cambiar estatus del registro"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTA_ESTATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 focus-visible:ring-offset-0"
                    onClick={() => onDelete(acta.id)}
                    aria-label="Eliminar registro"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page and record form
// ─────────────────────────────────────────────────────────────────────────────

export interface ActasSeguimientoPageProps {
  numeroEmpleado: string
}

function ActasDialogHeader({ nombreEmpleado, children }: { nombreEmpleado: string; children?: ReactNode }) {
  return (
    <div className="shrink-0 border-b border-border px-5 py-5 pr-14 sm:pl-6 sm:py-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-foreground">
          <FilePenLine size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Actas y seguimiento</DialogTitle>
          <DialogDescription className="mt-0.5 break-words text-xs leading-4 text-muted-foreground">{nombreEmpleado}</DialogDescription>
        </div>
      </div>
      {children}
    </div>
  )
}

function ActasDialogClose() {
  return (
    <DialogClose className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Cerrar</span>
    </DialogClose>
  )
}

const actasDialogContentClassName = "flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col gap-0 border-border p-0 sm:max-w-lg"
const actasDialogScrollStyle = { scrollbarGutter: "stable" } as const

export function ActasSeguimientoPage({ numeroEmpleado }: ActasSeguimientoPageProps) {
  const { canEdit } = useRole()
  const { loading, saving, error, fetchByEmpleado, create, update, remove } = useActasSeguimiento()

  const [records, setRecords] = useState<ActaSeguimiento[]>([])
  const [nombreEmpleado, setNombreEmpleado] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(blankForm)
  const [formError, setFormError] = useState<string | null>(null)
  const formId = useId()
  const tipoRef = useRef<HTMLButtonElement>(null)
  const newRecordRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    const data = await fetchByEmpleado(numeroEmpleado)
    setRecords(data)
  }, [fetchByEmpleado, numeroEmpleado])

  useEffect(() => {
    setRecords([])
    setNombreEmpleado(null)
    setPage(1)
    void load()
    let active = true
    supabase.from("employees").select("nombre").eq("numero", numeroEmpleado).maybeSingle()
      .then(({ data }) => { if (active) setNombreEmpleado(data?.nombre ?? null) })
    return () => { active = false }
  }, [load, numeroEmpleado])

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(1, Math.ceil(records.length / PAGE_SIZE))))
  }, [records.length])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.fecha) { setFormError("La fecha es obligatoria."); return }
    setFormError(null)
    const result = await create({
      numero_empleado: numeroEmpleado,
      tipo: form.tipo,
      fecha: form.fecha,
      descripcion: form.descripcion || null,
      fecha_seguimiento: form.fecha_seguimiento || null,
      estatus: form.estatus,
      created_by: null,
    })
    if (result.success) {
      setShowForm(false)
      setForm(blankForm())
      setPage(1)
      void load()
      notify.success("Registro guardado correctamente")
    } else {
      setFormError(result.error ?? "Error al guardar")
    }
  }

  const handleChangeEstatus = async (id: string, estatus: ActaEstatus) => {
    const result = await update(id, { estatus })
    if (result.success) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, estatus } : r))
    } else {
      notify.error(result.error ?? "Error al actualizar estatus")
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await notify.confirm({
      title: "Eliminar registro",
      description: "No se puede deshacer.",
      confirmLabel: "Eliminar",
      size: "xs",
      tone: "destructive",
    })
    if (!ok) return
    const result = await remove(id)
    if (result.success) {
      setRecords(prev => prev.filter(r => r.id !== id))
    } else {
      notify.error(result.error ?? "Error al eliminar")
    }
  }

  // ── Counts ────────────────────────────────────────────────────────────────
  const activos  = records.filter(r => r.estatus !== "CERRADO").length
  const vencidos = records.filter(r => isVencido(r.fecha_seguimiento) && r.estatus !== "CERRADO").length
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const visibleRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const displayName = nombreEmpleado ?? "Empleado"

  return (
    <>
      <div className="space-y-6">
        <Link href="/capacitacion" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">Núm. {numeroEmpleado}</p>
            <h2 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{displayName}</h2>
          </div>
          {canEdit && (
            <Button
              ref={newRecordRef}
              type="button"
              className="h-10 w-full shrink-0 focus-visible:ring-offset-0 sm:w-auto"
              onClick={() => { setForm(blankForm()); setFormError(null); setShowForm(true) }}
            >
              <Plus className="size-4" aria-hidden="true" /> Nuevo registro
            </Button>
          )}
        </header>

        <section aria-labelledby="actas-registros-title" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h3 id="actas-registros-title" className="text-xl font-semibold tracking-tight text-foreground">Registros</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border bg-card font-medium text-muted-foreground">{countLabel(records.length, "registro", "registros")}</Badge>
              {activos > 0 && <Badge variant="outline" className="border-border bg-card font-medium text-muted-foreground">{countLabel(activos, "activo", "activos")}</Badge>}
              {vencidos > 0 && <Badge variant="destructive" className="font-medium">{countLabel(vencidos, "vencido", "vencidos")}</Badge>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando registros...
            </div>
          ) : records.length === 0 && !error ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center">
              <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-foreground">Sin registros</p>
              <p className="text-sm text-muted-foreground">No hay actas ni planes de seguimiento para este empleado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRecords.map(acta => (
                <ActaRow key={acta.id} acta={acta} canEdit={canEdit} onChangeEstatus={handleChangeEstatus} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="border-t border-border pt-4">
              <PaginationBar currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false) }}>
          <DialogContent
            raw
            onOpenAutoFocus={event => { event.preventDefault(); tipoRef.current?.focus() }}
            onCloseAutoFocus={event => { event.preventDefault(); newRecordRef.current?.focus() }}
            className={actasDialogContentClassName}
          >
            <ActasDialogClose />
            <ActasDialogHeader nombreEmpleado={displayName} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6" style={actasDialogScrollStyle}>
              <form onSubmit={event => { event.preventDefault(); void handleSave() }} className="space-y-5">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Nuevo registro</h3>

                {formError && (
                  <Alert variant="destructive" className="py-2" role="alert">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription className="text-xs">{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Tipo */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`${formId}-tipo`} className="text-sm font-medium text-foreground">Tipo <span aria-hidden="true">*</span><span className="sr-only"> (obligatorio)</span></Label>
                    <Select
                      value={form.tipo}
                      onValueChange={v => setForm(f => ({ ...f, tipo: v as ActaTipo }))}
                    >
                      <SelectTrigger ref={tipoRef} id={`${formId}-tipo`} aria-required="true" className="h-10 border-border bg-card text-sm focus-visible:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTA_TIPOS.map(t => (
                          <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha */}
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor={`${formId}-fecha`} className="text-sm font-medium text-foreground">Fecha <span aria-hidden="true">*</span><span className="sr-only"> (obligatoria)</span></Label>
                    <Input
                      id={`${formId}-fecha`}
                      type="date"
                      required
                      value={form.fecha}
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      className="h-10 min-w-0 border-border bg-card text-sm focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Fecha seguimiento */}
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor={`${formId}-fecha-seguimiento`} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <CalendarClock className="size-4" aria-hidden="true" />
                      Fecha de revisión
                    </Label>
                    <Input
                      id={`${formId}-fecha-seguimiento`}
                      type="date"
                      value={form.fecha_seguimiento}
                      onChange={e => setForm(f => ({ ...f, fecha_seguimiento: e.target.value }))}
                      className="h-10 min-w-0 border-border bg-card text-sm focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Estatus */}
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-estatus`} className="text-sm font-medium text-foreground">Estatus</Label>
                    <Select
                      value={form.estatus}
                      onValueChange={v => setForm(f => ({ ...f, estatus: v as ActaEstatus }))}
                    >
                      <SelectTrigger id={`${formId}-estatus`} className="h-10 border-border bg-card text-sm focus-visible:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTA_ESTATUSES.map(s => (
                          <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-descripcion`} className="text-sm font-medium text-foreground">Descripción / motivo</Label>
                  <Textarea
                    id={`${formId}-descripcion`}
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe brevemente el motivo o los compromisos acordados..."
                    className="min-h-24 border-border bg-card text-sm focus-visible:ring-offset-0"
                  />
                </div>

                {/* Form actions */}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button
                    type="button" variant="ghost"
                    className="h-10 w-full focus-visible:ring-offset-0 sm:w-auto"
                    onClick={() => { setShowForm(false); setFormError(null) }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 w-full focus-visible:ring-offset-0 sm:w-auto"
                    disabled={saving}
                  >
                    {saving
                      ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
                      : <Check className="mr-1.5 size-4" aria-hidden="true" />}
                    Guardar
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
