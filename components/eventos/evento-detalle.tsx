"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, ChevronLeft, ChevronRight, MessageCircle, Star, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { confirm } from "@/components/ui/confirm-dialog"
import { useRole } from "@/lib/hooks"
import { StarRating } from "./star-rating"
import { ResenaForm } from "./resena-form"
import {
  eventoPublicUrl,
  useEventoResenas,
  useEventosAdmin,
  type EventoWithAggregates,
} from "@/lib/hooks/useEventos"

interface Props {
  evento: EventoWithAggregates | null
  onClose: () => void
  onChange?: () => void
}

export function EventoDetalle({ evento, onClose, onChange }: Props) {
  const open = !!evento
  const { canEdit } = useRole()
  const { resenas, loading: loadingResenas, publicar } = useEventoResenas(evento?.id ?? null)
  const { eliminarFoto, saving } = useEventosAdmin(onChange)

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [evento?.id])

  const total = evento?.fotos.length ?? 0

  const next = useCallback(() => {
    if (total > 0) setIndex((i) => (i + 1) % total)
  }, [total])

  const prev = useCallback(() => {
    if (total > 0) setIndex((i) => (i - 1 + total) % total)
  }, [total])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, next, prev])

  if (!evento) return null

  const fecha = evento.fecha
    ? new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const foto = evento.fotos[index]
  const fotoUrl = foto ? eventoPublicUrl(foto.storage_path) : null

  async function handleEliminarFoto() {
    if (!foto) return
    const ok = await confirm({
      title: "Eliminar foto",
      description: "Esta acción no se puede deshacer.",
      tone: "destructive",
      confirmLabel: "Eliminar",
    })
    if (!ok) return
    try {
      await eliminarFoto(foto.id, foto.storage_path)
      setIndex((i) => Math.max(0, Math.min(i, total - 2)))
    } catch {
      /* toast emitido en el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        raw
        className="sm:max-w-4xl w-full p-0 overflow-hidden bg-card [&>button.absolute]:hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{evento.titulo}</DialogTitle>
          <DialogDescription>{evento.descripcion ?? evento.titulo}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] max-h-[88vh]">
          {/* Visor */}
          <div className="relative flex flex-col bg-background">
            <div className="relative flex-1 min-h-[240px] lg:min-h-[420px] bg-muted/40 flex items-center justify-center">
              {fotoUrl ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={foto!.id}
                    src={fotoUrl}
                    alt={foto?.caption ?? evento.titulo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-h-[60vh] w-full object-contain"
                    loading="lazy"
                  />
                </AnimatePresence>
              ) : (
                <p className="text-sm text-muted-foreground">Este evento aún no tiene fotos.</p>
              )}

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border/60 flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border/60 flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-2 right-2 h-9 w-9 rounded-full bg-background/80 backdrop-blur border border-border/60 flex items-center justify-center hover:bg-background transition"
              >
                <X size={16} />
              </button>

              {total > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 backdrop-blur border border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {index + 1} / {total}
                </div>
              )}
            </div>

            <div className="border-t border-border/60 p-3 flex items-center gap-2 overflow-x-auto">
              {evento.fotos.map((f, i) => {
                const url = eventoPublicUrl(f.storage_path)
                if (!url) return null
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`relative shrink-0 h-14 w-14 rounded-md overflow-hidden border transition ${
                      i === index ? "border-primary ring-2 ring-primary/30" : "border-border/60 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Foto ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                )
              })}
              {canEdit && foto && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEliminarFoto}
                  disabled={saving}
                  className="ml-auto shrink-0 gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Quitar foto</span>
                </Button>
              )}
            </div>
          </div>

          {/* Reseñas */}
          <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-border/60 min-h-0">
            <div className="p-4 border-b border-border/60">
              <p className="text-lg font-semibold truncate">{evento.titulo}</p>
              {fecha && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {fecha}
                </p>
              )}
              {evento.descripcion && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{evento.descripcion}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <StarRating value={evento.rating_avg ?? 0} size={16} readOnly />
                <span className="text-xs text-muted-foreground">
                  {evento.rating_avg != null
                    ? `${evento.rating_avg.toFixed(1)} · ${evento.rating_count} reseña${evento.rating_count !== 1 ? "s" : ""}`
                    : "Sin reseñas aún"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ResenaForm onSubmit={publicar} />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MessageCircle size={12} /> Reseñas
                </p>
                {loadingResenas ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-md border border-border/60 bg-muted/40 p-3 animate-pulse">
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="h-3 w-full bg-muted rounded mt-2" />
                      </div>
                    ))}
                  </div>
                ) : resenas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay reseñas. ¡Sé el primero!</p>
                ) : (
                  <ul className="space-y-2">
                    {resenas.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-md border border-border/60 bg-background p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{r.nombre}</p>
                          <StarRating value={r.rating} size={12} readOnly />
                        </div>
                        {r.comentario && (
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {r.comentario}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Star size={10} />
                          {new Date(r.created_at).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
