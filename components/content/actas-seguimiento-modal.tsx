"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle, ChevronDown, ChevronUp, FileWarning,
  Loader2, Plus, Save, Trash2, CheckCircle2, Clock,
  CalendarCheck, FileX,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader,
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
import {
  useActasSeguimiento,
  ACTA_TIPOS, ACTA_ESTATUSES,
  type ActaSeguimiento, type ActaTipo, type ActaEstatus,
} from "@/lib/hooks/useActasSeguimiento"
import { useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function today(): string {
  return new Date().toISOString().split("T")[0]
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
  const cfg: Record<ActaEstatus, { label: string; className: string }> = {
    ACTIVO:           { label: "Activo",         className: "bg-destructive/15 text-destructive border-destructive/30" },
    "EN SEGUIMIENTO": { label: "En seguimiento", className: "bg-warning/15 text-warning border-warning/30" },
    CERRADO:          { label: "Cerrado",         className: "bg-success/15 text-success border-success/30" },
  }
  const { label, className } = cfg[estatus] ?? cfg["ACTIVO"]
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${className}`}>
      {label}
    </Badge>
  )
}

function TipoBadge({ tipo }: { tipo: ActaTipo }) {
  const isActa = tipo === "ACTA ADMINISTRATIVA"
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold shrink-0 ${
        isActa
          ? "bg-destructive/10 text-destructive border-destructive/25"
          : "bg-primary/10 text-primary border-primary/25"
      }`}
    >
      {isActa ? "Acta" : "Plan"}
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

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <TipoBadge tipo={acta.tipo} />
        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {acta.descripcion || "Sin descripción"}
        </span>

        {/* Date pill */}
        {acta.fecha_seguimiento && (
          <span
            className={`hidden sm:flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 shrink-0 ${
              vencido
                ? "bg-destructive/15 text-destructive"
                : proximo
                ? "bg-warning/15 text-warning"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {vencido ? <AlertTriangle size={10} aria-hidden="true" /> : <Clock size={10} aria-hidden="true" />}
            {formatDate(acta.fecha_seguimiento)}
          </span>
        )}

        <EstatusBadge estatus={acta.estatus} />
        {open
          ? <ChevronUp size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
          : <ChevronDown size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t px-3 sm:px-4 py-3 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Tipo</p>
                  <p className="font-medium">{acta.tipo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Fecha</p>
                  <p className="font-medium">{formatDate(acta.fecha)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Seguimiento</p>
                  <p className={`font-medium flex items-center gap-1 ${vencido ? "text-destructive" : proximo ? "text-warning" : ""}`}>
                    {formatDate(acta.fecha_seguimiento)}
                    {vencido && (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle size={10} aria-hidden="true" />
                        Vencido
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {acta.descripcion && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">Descripción</p>
                  <p className="whitespace-pre-line">{acta.descripcion}</p>
                </div>
              )}

              {/* Actions */}
              {canEdit && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Select
                    value={acta.estatus}
                    onValueChange={v => onChangeEstatus(acta.id, v as ActaEstatus)}
                  >
                    <SelectTrigger
                      className="h-7 w-44 text-xs bg-background"
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
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(acta.id)}
                    aria-label="Eliminar registro"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

export interface ActasSeguimientoModalProps {
  open: boolean
  onClose: () => void
  numeroEmpleado: string
  nombreEmpleado: string
}

export function ActasSeguimientoModal({
  open, onClose, numeroEmpleado, nombreEmpleado,
}: ActasSeguimientoModalProps) {
  const { canEdit } = useRole()
  const { loading, saving, error, fetchByEmpleado, create, update, remove } = useActasSeguimiento()

  const [records, setRecords] = useState<ActaSeguimiento[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(blankForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Reload whenever dialog opens
  const load = useCallback(async () => {
    const data = await fetchByEmpleado(numeroEmpleado)
    setRecords(data)
  }, [fetchByEmpleado, numeroEmpleado])

  useEffect(() => {
    if (open) {
      setShowForm(false)
      setForm(blankForm())
      setFormError(null)
      setSaveSuccess(false)
      load()
    }
  }, [open, load])

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
      setSaveSuccess(true)
      setShowForm(false)
      setForm(blankForm())
      load()
      setTimeout(() => setSaveSuccess(false), 3000)
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
      description: "Se eliminará este acta o plan de seguimiento. No se puede deshacer.",
      confirmLabel: "Eliminar",
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

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <FileWarning size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base leading-tight">Actas y Seguimiento</DialogTitle>
                <DialogDescription className="text-xs mt-0.5 line-clamp-1">{nombreEmpleado}</DialogDescription>
              </div>
            </div>
          </div>

          {/* Summary pills */}
          {records.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-[11px] font-medium bg-muted rounded-full px-2.5 py-1">
                <FileWarning size={10} aria-hidden="true" /> {records.length} registros
              </span>
              {activos > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium bg-warning/10 text-warning rounded-full px-2.5 py-1">
                  <Clock size={10} aria-hidden="true" /> {activos} activos
                </span>
              )}
              {vencidos > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium bg-destructive/10 text-destructive rounded-full px-2.5 py-1">
                  <AlertTriangle size={10} aria-hidden="true" /> {vencidos} vencidos
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
          {/* Success */}
          {saveSuccess && (
            <Alert className="border-success/30 bg-success/10 py-2" role="status">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              <AlertDescription className="text-success text-sm">Guardado correctamente.</AlertDescription>
            </Alert>
          )}

          {/* Global error */}
          {error && (
            <Alert variant="destructive" className="py-2" role="alert">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="text-sm">Cargando...</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && records.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <FileX size={22} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin registros</p>
              <p className="text-xs text-muted-foreground">No hay actas ni planes de seguimiento para este empleado.</p>
            </div>
          )}

          {/* Records list */}
          {!loading && records.map(acta => (
            <ActaRow
              key={acta.id}
              acta={acta}
              canEdit={canEdit}
              onChangeEstatus={handleChangeEstatus}
              onDelete={handleDelete}
            />
          ))}

          {/* New record form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold text-foreground">Nuevo registro</h3>

                {formError && (
                  <Alert variant="destructive" className="py-2" role="alert">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription className="text-xs">{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tipo */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="acta-tipo" className="text-xs text-muted-foreground">Tipo *</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={v => setForm(f => ({ ...f, tipo: v as ActaTipo }))}
                    >
                      <SelectTrigger id="acta-tipo" className="bg-background h-9 text-sm">
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
                  <div className="space-y-1.5">
                    <Label htmlFor="acta-fecha" className="text-xs text-muted-foreground">Fecha *</Label>
                    <Input
                      id="acta-fecha"
                      type="date"
                      required
                      value={form.fecha}
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      className="bg-background h-9 text-sm"
                    />
                  </div>

                  {/* Fecha seguimiento */}
                  <div className="space-y-1.5">
                    <Label htmlFor="acta-fecha-seguimiento" className="text-xs text-muted-foreground">
                      <CalendarCheck size={10} className="inline mr-1" aria-hidden="true" />
                      Fecha de revisión
                    </Label>
                    <Input
                      id="acta-fecha-seguimiento"
                      type="date"
                      value={form.fecha_seguimiento}
                      onChange={e => setForm(f => ({ ...f, fecha_seguimiento: e.target.value }))}
                      className="bg-background h-9 text-sm"
                    />
                  </div>

                  {/* Estatus */}
                  <div className="space-y-1.5">
                    <Label htmlFor="acta-estatus" className="text-xs text-muted-foreground">Estatus</Label>
                    <Select
                      value={form.estatus}
                      onValueChange={v => setForm(f => ({ ...f, estatus: v as ActaEstatus }))}
                    >
                      <SelectTrigger id="acta-estatus" className="bg-background h-9 text-sm">
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
                <div className="space-y-1.5">
                  <Label htmlFor="acta-descripcion" className="text-xs text-muted-foreground">Descripción / Motivo</Label>
                  <Textarea
                    id="acta-descripcion"
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe brevemente el motivo o los compromisos acordados..."
                    className="bg-background min-h-[80px] text-sm resize-none"
                  />
                </div>

                {/* Form actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                  <Button
                    variant="ghost" size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => { setShowForm(false); setFormError(null) }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving
                      ? <Loader2 size={13} className="animate-spin mr-1.5" aria-hidden="true" />
                      : <Save size={13} className="mr-1.5" aria-hidden="true" />}
                    Guardar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {canEdit && !showForm && (
          <div className="shrink-0 border-t px-4 sm:px-5 py-3 flex justify-end">
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => { setShowForm(true); setSaveSuccess(false) }}
            >
              <Plus size={13} className="mr-1.5" aria-hidden="true" />
              Nuevo registro
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
