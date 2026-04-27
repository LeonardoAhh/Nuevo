"use client"

import { useRef, useState } from "react"
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { confirm } from "@/components/ui/confirm-dialog"
import {
  eventoPublicUrl,
  useEventosAdmin,
  type EventoWithAggregates,
} from "@/lib/hooks/useEventos"

interface Props {
  eventos: EventoWithAggregates[]
  onChange: () => void
}

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB por archivo

export function EventosAdminPanel({ eventos, onChange }: Props) {
  const { saving, crearEvento, subirFotos, eliminarEvento } = useEventosAdmin(onChange)

  const [createOpen, setCreateOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCrear() {
    setCreateError(null)
    if (titulo.trim().length < 2) {
      setCreateError("El título es obligatorio")
      return
    }
    try {
      await crearEvento({
        titulo,
        descripcion: descripcion || null,
        fecha: fecha || null,
      })
      setTitulo("")
      setDescripcion("")
      setFecha("")
      setCreateOpen(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error al crear")
    }
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold">Panel de administración</p>
          <p className="text-xs text-muted-foreground">
            Crea eventos y sube fotos. Solo visible para rol <code>dev</code>.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus size={14} /> Nuevo evento
        </Button>
      </div>

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tienes eventos. Crea el primero.</p>
      ) : (
        <ul className="space-y-2">
          {eventos.map((ev) => (
            <EventoAdminRow
              key={ev.id}
              evento={ev}
              saving={saving}
              onUpload={(files, asCover) => subirFotos(ev.id, files, { asCover })}
              onDelete={async () => {
                const ok = await confirm({
                  title: `Eliminar "${ev.titulo}"`,
                  description:
                    "Se eliminarán todas las fotos y reseñas asociadas. Esta acción no se puede deshacer.",
                  tone: "destructive",
                  confirmLabel: "Eliminar evento",
                })
                if (ok) await eliminarEvento(ev.id)
              }}
            />
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
            <DialogDescription>Podrás subir fotos una vez creado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-titulo">Título</Label>
              <Input
                id="ev-titulo"
                placeholder="Ej. Posada 2025"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-fecha">Fecha (opcional)</Label>
              <Input
                id="ev-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Descripción (opcional)</Label>
              <Textarea
                id="ev-desc"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={500}
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {createError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleCrear} disabled={saving} className="gap-1.5">
                <Plus size={14} /> Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

interface RowProps {
  evento: EventoWithAggregates
  saving: boolean
  onUpload: (files: File[], asCover: boolean) => Promise<unknown>
  onDelete: () => void
}

function EventoAdminRow({ evento, saving, onUpload, onDelete }: RowProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const coverUrl = eventoPublicUrl(evento.cover_path ?? evento.fotos[0]?.storage_path ?? null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null)
    const input = e.target
    const files = Array.from(input.files ?? [])
    if (files.length === 0) return

    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setUploadError(`"${f.name}" no es una imagen válida`)
        input.value = ""
        return
      }
      if (f.size > MAX_BYTES) {
        setUploadError(`"${f.name}" supera los 8 MB`)
        input.value = ""
        return
      }
    }

    try {
      await onUpload(files, evento.fotos.length === 0)
    } catch {
      /* toast en el hook */
    } finally {
      input.value = ""
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-2">
      <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-muted/40 border border-border/60">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImagePlus size={16} className="text-muted-foreground/60" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{evento.titulo}</p>
        <p className="text-[11px] text-muted-foreground">
          {evento.fotos.length} foto{evento.fotos.length !== 1 ? "s" : ""}
          {evento.rating_count > 0 &&
            ` · ${evento.rating_count} reseña${evento.rating_count !== 1 ? "s" : ""}`}
        </p>
        {uploadError && (
          <p className="text-[11px] text-destructive mt-1">{uploadError}</p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => fileRef.current?.click()}
        disabled={saving}
      >
        <Upload size={14} />
        <span className="hidden sm:inline">Subir</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={saving}
        aria-label="Eliminar evento"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 size={14} />
      </Button>
    </li>
  )
}
