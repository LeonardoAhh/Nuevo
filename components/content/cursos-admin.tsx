"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  QrCode,
  AlertCircle,
  Copy,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useCursosPublicos, type CursoPublico, type CursoPublicoInput } from "@/lib/hooks"
import { useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import { detectarCategoria, getToneClasses } from "@/lib/constants/cursos-categorias"

// ─── Cover semántico (mismo patrón que /recursos) ────────────────────────────

function CategoriaCover({
  nombre,
  imagenUrl,
  className,
  iconSize = 32,
  compact = false,
}: {
  nombre: string
  imagenUrl?: string | null
  className?: string
  iconSize?: number
  /** Versión reducida: solo icono sobre gradiente, sin label ni decoración */
  compact?: boolean
}) {
  if (imagenUrl) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagenUrl}
          alt={nombre}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  const cat = detectarCategoria(nombre || "general")
  const tone = getToneClasses(cat.tone)
  const Icon = cat.icon

  if (compact) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center ${className ?? ""}`}
        style={{ backgroundImage: tone.gradient }}
        aria-label={cat.label}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_40%)]" />
        <Icon className="relative text-white" size={iconSize} strokeWidth={1.75} />
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className ?? ""}`}
      style={{ backgroundImage: tone.gradient }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative flex flex-col items-center justify-center text-white">
        <div className="rounded-full bg-white/15 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <Icon className="text-white" size={iconSize} strokeWidth={1.5} />
        </div>
        <span className="mt-2 text-[10px] uppercase tracking-[0.28em] text-white/80">
          {cat.label}
        </span>
      </div>
      <Icon
        className="absolute -right-3 -bottom-3 text-white/15"
        size={Math.round(iconSize * 2.6)}
        strokeWidth={1}
      />
    </div>
  )
}

// ─── Formulario ───────────────────────────────────────────────────────────────

interface CursoFormState {
  nombre: string
  descripcion: string
  url: string
  imagen_url: string
  activo: boolean
  orden: number
}

const EMPTY_FORM: CursoFormState = {
  nombre: "",
  descripcion: "",
  url: "",
  imagen_url: "",
  activo: true,
  orden: 0,
}

// ─── Dialog form ─────────────────────────────────────────────────────────────

interface CursoDialogProps {
  open: boolean
  saving: boolean
  inicial?: CursoPublico | null
  onClose: () => void
  onSave: (data: CursoPublicoInput) => Promise<void>
}

function CursoDialog({ open, saving, inicial, onClose, onSave }: CursoDialogProps) {
  const isEdit = !!inicial

  const [form, setForm] = useState<CursoFormState>(
    inicial
      ? {
          nombre: inicial.nombre,
          descripcion: inicial.descripcion ?? "",
          url: inicial.url,
          imagen_url: inicial.imagen_url ?? "",
          activo: inicial.activo,
          orden: inicial.orden,
        }
      : EMPTY_FORM
  )
  const [errors, setErrors] = useState<Partial<Record<keyof CursoFormState, string>>>({})

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        inicial
          ? {
              nombre: inicial.nombre,
              descripcion: inicial.descripcion ?? "",
              url: inicial.url,
              imagen_url: inicial.imagen_url ?? "",
              activo: inicial.activo,
              orden: inicial.orden,
            }
          : EMPTY_FORM
      )
    }
  }, [open, inicial])

  const set = <K extends keyof CursoFormState>(key: K, value: CursoFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido"
    if (!form.url.trim()) {
      e.url = "La URL es requerida"
    } else {
      try {
        new URL(form.url.trim())
      } catch {
        e.url = "URL inválida (incluye https://)"
      }
    }
    if (form.imagen_url.trim()) {
      try {
        new URL(form.imagen_url.trim())
      } catch {
        e.imagen_url = "URL de imagen inválida"
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    await onSave({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      url: form.url.trim(),
      imagen_url: form.imagen_url.trim() || null,
      activo: form.activo,
      orden: form.orden,
    })
  }

  const qrPreview =
    form.url.trim()
      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(form.url.trim())}&margin=6`
      : null

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-lg"
      title={isEdit ? "Editar curso" : "Nuevo curso"}
      description="Completa los datos del curso público"
    >
      <ModalToolbar
        title={isEdit ? "Editar curso" : "Nuevo curso"}
        saving={saving}
        onClose={onClose}
        onConfirm={handleSave}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-5 px-4 py-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del curso *</Label>
            <Input
              id="nombre"
              placeholder="Ej. Seguridad industrial básica"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className="bg-muted"
              autoFocus
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Breve descripción del contenido..."
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              className="bg-muted resize-none"
              rows={3}
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">URL del curso *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              className="bg-muted"
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>

          {/* Imagen URL */}
          <div className="space-y-1.5">
            <Label htmlFor="imagen_url">URL de imagen (opcional)</Label>
            <Input
              id="imagen_url"
              type="url"
              placeholder="https://... (jpg, png, webp)"
              value={form.imagen_url}
              onChange={(e) => set("imagen_url", e.target.value)}
              className="bg-muted"
            />
            {errors.imagen_url && <p className="text-xs text-destructive">{errors.imagen_url}</p>}
            {/* Image preview — custom URL or auto category cover */}
            {form.nombre.trim() && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {form.imagen_url.trim()
                    ? 'Imagen personalizada:'
                    : `Cover automático (${detectarCategoria(form.nombre).label}):`}
                </p>
                <CategoriaCover
                  nombre={form.nombre}
                  imagenUrl={form.imagen_url.trim() || undefined}
                  className="rounded-md border h-28 w-full"
                  iconSize={48}
                />
              </div>
            )}
          </div>

          {/* Orden */}
          <div className="space-y-1.5">
            <Label htmlFor="orden">Orden de aparición</Label>
            <Input
              id="orden"
              type="number"
              min={0}
              value={form.orden}
              onChange={(e) => set("orden", Number(e.target.value))}
              className="bg-muted w-28"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <Switch
              id="activo"
              checked={form.activo}
              onCheckedChange={(v) => set("activo", v)}
            />
            <Label htmlFor="activo">Visible en página pública</Label>
          </div>

          {/* QR Preview */}
          {qrPreview && (
            <div className="space-y-1.5">
              <Label>Vista previa del QR</Label>
              <div className="border rounded-lg p-3 bg-white inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrPreview} alt="Preview QR" width={120} height={120} loading="lazy" />
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}

// ─── Row card ────────────────────────────────────────────────────────────────

interface CursoRowProps {
  curso: CursoPublico
  canEdit: boolean
  onEdit: (c: CursoPublico) => void
  onToggle: (c: CursoPublico) => void
  onDelete: (c: CursoPublico) => void
}

function CursoRow({ curso, canEdit, onEdit, onToggle, onDelete }: CursoRowProps) {
  return (
    <Card className={`transition-opacity ${curso.activo ? "" : "opacity-60"}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          {/* Thumbnail — visible en todos los tamaños */}
          <div className="shrink-0">
            <CategoriaCover
              nombre={curso.nombre}
              imagenUrl={curso.imagen_url}
              compact
              className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md border"
              iconSize={20}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm leading-tight truncate">
                {curso.nombre}
              </span>
              {/* Solo mostramos badge cuando está oculto — señal informativa, no ruido */}
              {!curso.activo && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] leading-none shrink-0"
                >
                  Oculto
                </Badge>
              )}
            </div>
            {curso.descripcion && (
              <p className="text-xs text-muted-foreground line-clamp-2">{curso.descripcion}</p>
            )}
            <a
              href={curso.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 min-w-0"
            >
              <ExternalLink size={11} className="shrink-0" />
              <span className="truncate">{curso.url}</span>
            </a>
          </div>

          {/* Actions — solo dev. Tap targets grandes en móvil. */}
          {canEdit && (
            <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-8 sm:w-8"
                onClick={() => onToggle(curso)}
                title={curso.activo ? "Ocultar" : "Mostrar"}
                aria-label={curso.activo ? "Ocultar curso" : "Mostrar curso"}
              >
                {curso.activo ? <EyeOff size={15} /> : <Eye size={15} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-8 sm:w-8"
                onClick={() => onEdit(curso)}
                title="Editar"
                aria-label="Editar curso"
              >
                <Pencil size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(curso)}
                title="Eliminar"
                aria-label="Eliminar curso"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

export default function CursosAdminContent() {
  const { canEdit } = useRole()
  const { cursos, loading, error, crear, actualizar, eliminar } = useCursosPublicos()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CursoPublico | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CursoPublico | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [qrPublicOpen, setQrPublicOpen] = useState(false)

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (curso: CursoPublico) => {
    setEditTarget(curso)
    setDialogOpen(true)
  }

  const handleSave = async (data: CursoPublicoInput) => {
    setSaving(true)
    try {
      if (editTarget) {
        await actualizar(editTarget.id, data)
        notify.success("Curso actualizado")
      } else {
        await crear(data)
        notify.success("Curso creado")
      }
      setDialogOpen(false)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (curso: CursoPublico) => {
    try {
      await actualizar(curso.id, { activo: !curso.activo })
      notify.success(curso.activo ? "Curso ocultado" : "Curso visible")
    } catch {
      notify.error("Error al actualizar")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eliminar(deleteTarget.id)
      notify.success("Curso eliminado")
      setDeleteTarget(null)
    } catch {
      notify.error("Error al eliminar")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
        {/* Header bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base sm:text-lg font-semibold">Cursos</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cursos visibles en{" "}
              <a
                href="/recursos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                /recursos <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setQrPublicOpen(true)}
              className="gap-2 px-2.5 sm:px-4"
              title="Mostrar QR público"
              aria-label="Mostrar QR público"
            >
              <QrCode size={16} />
              <span className="hidden sm:inline">Mostrar QR</span>
            </Button>
            {canEdit && (
              <Button
                onClick={openCreate}
                className="gap-2 px-2.5 sm:px-4"
                aria-label="Nuevo curso"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuevo curso</span>
              </Button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[84px] sm:h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cursos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 border rounded-lg bg-muted/30">
            <QrCode size={40} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {canEdit ? "Sin cursos. Crea el primero." : "Sin cursos disponibles."}
            </p>
            {canEdit && (
              <Button variant="outline" onClick={openCreate} className="gap-2">
                <Plus size={15} />
                Nuevo curso
              </Button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && cursos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
            {cursos.map((curso) => (
              <CursoRow
                key={curso.id}
                curso={curso}
                canEdit={canEdit}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {!loading && cursos.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {cursos.filter((c) => c.activo).length} activos · {cursos.length} total
          </p>
        )}

        {/* Create / Edit dialog */}
      <CursoDialog
        open={dialogOpen}
        saving={saving}
        inicial={editTarget}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation dialog */}
      <ResponsiveShell
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="sm:max-w-sm"
        title="Eliminar curso"
        description="Esta acción no se puede deshacer"
      >
        <ModalToolbar
          title="Eliminar curso"
          saving={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          confirmVariant="destructive"
        />
        <div className="px-4 py-5 space-y-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se eliminará permanentemente <strong>{deleteTarget?.nombre}</strong>. No se puede deshacer.
            </AlertDescription>
          </Alert>
        </div>
      </ResponsiveShell>

      {/* Public QR dialog */}
      <PublicQrDialog open={qrPublicOpen} onClose={() => setQrPublicOpen(false)} />
    </div>
  )
}

// ─── Public QR dialog ────────────────────────────────────────────────────────

function PublicQrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  const publicUrl = useMemo(() => (origin ? `${origin}/recursos` : "/recursos"), [origin])

  const qrLarge = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl]
  )

  const qrDownload = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=20&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      notify.success("Enlace copiado")
    } catch {
      notify.error("No se pudo copiar")
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = qrDownload
    link.download = "qr-cursos-publicos.png"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            QR de cursos públicos
          </DialogTitle>
          <DialogDescription>
            Escanea para abrir la página pública de cursos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* QR frame: fondo blanco fijo (legibilidad), borde con tokens */}
          <div className="rounded-2xl bg-white p-4 sm:p-6 border border-border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrLarge}
              alt={`Código QR para ${publicUrl}`}
              width={300}
              height={300}
              className="block w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]"
            />
          </div>

          {/* URL visible (tokens light/dark) */}
          <div className="w-full">
            <Label className="text-xs text-muted-foreground">URL pública</Label>
            <div className="mt-1 flex items-stretch gap-2">
              <Input
                readOnly
                value={publicUrl}
                className="bg-muted font-mono text-xs sm:text-sm"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label="Copiar enlace"
                title="Copiar enlace"
              >
                <Copy size={15} />
              </Button>
            </div>
          </div>

          {/* Acciones */}
          <div className="w-full flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
              <Download size={14} />
              Descargar PNG
            </Button>
            <Button asChild className="flex-1 gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                Abrir
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
