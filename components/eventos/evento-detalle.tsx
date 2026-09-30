"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { confirm } from "@/components/ui/confirm-dialog"
import { useRole } from "@/lib/hooks"
import { useIsMobile } from "@/components/ui/responsive-shell"
import { StarRating } from "./star-rating"
import { ResenaForm } from "./resena-form"
import {
  eventoPublicUrl,
  isVideoPath,
  useEventoResenas,
  useEventosAdmin,
  type EventoWithAggregates,
  type EventoFoto,
} from "@/lib/hooks/useEventos"

interface Props {
  evento: EventoWithAggregates | null
  onClose: () => void
  onChange?: () => void
}

export function EventoDetalle({ evento, onClose, onChange }: Props) {
  const { canEdit } = useRole()
  const isMobile = useIsMobile(1023)
  const { resenas, loading: loadingResenas, publicar } = useEventoResenas(evento?.id ?? null)
  const { eliminarFoto, saving } = useEventosAdmin(onChange)
  const [index, setIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"fotos" | "videos">("fotos")
  const [mobilePanel, setMobilePanel] = useState<"media" | "reviews">("media")
  const [reviewView, setReviewView] = useState<"list" | "form">("list")
  const [reviewPage, setReviewPage] = useState(0)

  const { fotosList, videosList } = useMemo(() => {
    const fotos: EventoFoto[] = []
    const videos: EventoFoto[] = []
    for (const item of evento?.fotos ?? []) {
      if (isVideoPath(item.storage_path)) videos.push(item)
      else fotos.push(item)
    }
    return { fotosList: fotos, videosList: videos }
  }, [evento?.fotos])

  useEffect(() => {
    if (!evento) return
    const hasFotos = evento.fotos.some((item) => !isVideoPath(item.storage_path))
    setActiveTab(hasFotos || evento.fotos.length === 0 ? "fotos" : "videos")
    setIndex(0)
    setMobilePanel("media")
    setReviewPage(0)
  }, [evento?.id])

  const currentList = activeTab === "fotos" ? fotosList : videosList
  const total = currentList.length
  const safeIndex = total === 0 ? 0 : Math.min(Math.max(index, 0), total - 1)
  const archivo = currentList[safeIndex] ?? null
  const archivoUrl = archivo ? eventoPublicUrl(archivo.storage_path) : null

  const next = useCallback(() => {
    if (total > 0) setIndex((current) => (current + 1) % total)
  }, [total])
  const prev = useCallback(() => {
    if (total > 0) setIndex((current) => (current - 1 + total) % total)
  }, [total])

  useEffect(() => {
    if (!evento || (isMobile && mobilePanel !== "media")) return
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [role=radio]")) return
      if (event.key === "ArrowRight") next()
      if (event.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [evento, isMobile, mobilePanel, next, prev])

  if (!evento) return null

  const fecha = evento.fecha
    ? new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const reviewPageCount = Math.max(1, Math.ceil(resenas.length / 2))
  const visibleResenas = isMobile
    ? resenas.slice(reviewPage * 2, reviewPage * 2 + 2)
    : resenas
  async function handleEliminarArchivo() {
    if (!archivo) return
    const ok = await confirm({
      title: "Eliminar archivo",
      description: "Esta acción no se puede deshacer.",
      tone: "destructive",
      confirmLabel: "Eliminar",
    })
    if (!ok) return
    try {
      await eliminarFoto(archivo.id, archivo.storage_path)
      setIndex((current) => Math.max(0, current - 1))
    } catch {
      // El hook muestra el error.
    }
  }

  const handleClose = () => {
    setMobilePanel("media")
    onClose()
  }

  const detailContent = (
    <>
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:px-6">
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="text-lg">{evento.titulo}</DialogTitle>
            <DialogDescription className="line-clamp-1 lg:line-clamp-2">
              {evento.descripcion || "Fotos, videos y reseñas del evento."}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
              {fecha && <time dateTime={evento.fecha ?? undefined}>{fecha}</time>}
              <span className="inline-flex items-center gap-1.5">
                <StarRating value={evento.rating_avg ?? 0} size={14} readOnly />
                {evento.rating_count > 0
                  ? `${(evento.rating_avg ?? 0).toFixed(1)} · ${evento.rating_count} reseña${evento.rating_count === 1 ? "" : "s"}`
                  : "Sin reseñas"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar evento"
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="grid min-h-0 lg:max-h-[calc(100dvh-9rem)] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          {(!isMobile || mobilePanel === "media") && (
          <section aria-label="Galería del evento" className="min-w-0 space-y-3 p-4 sm:p-6">
            {fotosList.length > 0 && videosList.length > 0 && (
              <div className="flex gap-2" aria-label="Tipo de archivo">
                <Button
                  type="button"
                  size="sm"
                  variant={activeTab === "fotos" ? "default" : "outline"}
                  aria-pressed={activeTab === "fotos"}
                  onClick={() => { setActiveTab("fotos"); setIndex(0) }}
                  className="min-h-10"
                >
                  Fotos ({fotosList.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeTab === "videos" ? "default" : "outline"}
                  aria-pressed={activeTab === "videos"}
                  onClick={() => { setActiveTab("videos"); setIndex(0) }}
                  className="min-h-10"
                >
                  Videos ({videosList.length})
                </Button>
              </div>
            )}

            <div className="relative flex h-[32dvh] min-h-[160px] max-h-[280px] items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 lg:aspect-[4/3] lg:h-auto lg:max-h-[54dvh]">
              {archivoUrl ? (
                isVideoPath(archivo!.storage_path) ? (
                  <video
                    key={archivo!.id}
                    src={archivoUrl}
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={archivo!.id}
                    src={archivoUrl}
                    alt={archivo?.caption || `${evento.titulo}, imagen ${safeIndex + 1}`}
                    className="h-full w-full object-contain"
                    loading="eager"
                    decoding="async"
                  />
                )
              ) : (
                <p className="px-4 text-center text-sm text-muted-foreground">Este evento aún no tiene archivos.</p>
              )}

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Archivo anterior"
                    className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-card/95 text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Archivo siguiente"
                    className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-card/95 text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {total > 0 && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs tabular-nums text-muted-foreground">{safeIndex + 1} de {total}</p>
                {canEdit && archivo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleEliminarArchivo}
                    disabled={saving}
                    className="min-h-10 gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Eliminar archivo
                  </Button>
                )}
              </div>
            )}

            {total > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Seleccionar archivo">
                {currentList.map((item, itemIndex) => {
                  const url = eventoPublicUrl(item.storage_path)
                  if (!url) return null
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      aria-label={`${activeTab === "fotos" ? "Foto" : "Video"} ${itemIndex + 1} de ${total}`}
                      aria-current={itemIndex === safeIndex ? "true" : undefined}
                      className={`size-12 shrink-0 overflow-hidden sm:size-14 rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${itemIndex === safeIndex ? "border-foreground" : "border-border opacity-70 hover:opacity-100"}`}
                    >
                      {isVideoPath(item.storage_path) ? (
                        <video src={url} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
          )}

          {(!isMobile || mobilePanel === "reviews") && (
          <section aria-labelledby="resenas-heading" className="min-h-0 space-y-4 border-t border-border p-4 sm:p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
            {isMobile && (
              <div role="group" aria-label="Vista de reseñas" className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={reviewView === "list" ? "default" : "outline"}
                  aria-pressed={reviewView === "list"}
                  onClick={() => setReviewView("list")}
                  className="min-h-10"
                >
                  Reseñas ({resenas.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={reviewView === "form" ? "default" : "outline"}
                  aria-pressed={reviewView === "form"}
                  onClick={() => setReviewView("form")}
                  className="min-h-10"
                >
                  Escribir reseña
                </Button>
              </div>
            )}
            <div className={isMobile && reviewView !== "form" ? "hidden" : undefined}>
              <ResenaForm
                onSubmit={async (input) => {
                  await publicar(input)
                  setReviewPage(0)
                  setReviewView("list")
                }}
              />
            </div>
            <div className={isMobile && reviewView !== "list" ? "hidden" : "space-y-3"}>
              <h3 id="resenas-heading" className={isMobile ? "sr-only" : "text-sm font-semibold text-foreground"}>
                Reseñas ({resenas.length})
              </h3>
              {loadingResenas ? (
                <p role="status" className="text-sm text-muted-foreground">Cargando reseñas…</p>
              ) : resenas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay reseñas.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border border-t border-border">
                    {visibleResenas.map((resena) => (
                      <li key={resena.id} className="space-y-1 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{resena.nombre}</p>
                          <StarRating value={resena.rating} size={13} readOnly />
                        </div>
                        {resena.comentario && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                            {resena.comentario}
                          </p>
                        )}
                        <time dateTime={resena.created_at} className="block text-xs text-muted-foreground">
                          {new Date(resena.created_at).toLocaleDateString("es-MX", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </time>
                      </li>
                    ))}
                  </ul>
                  {isMobile && reviewPageCount > 1 && (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <Button type="button" variant="outline" size="sm" disabled={reviewPage === 0} onClick={() => setReviewPage((page) => page - 1)}>
                        Anterior
                      </Button>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {reviewPage + 1} de {reviewPageCount}
                      </span>
                      <Button type="button" variant="outline" size="sm" disabled={reviewPage + 1 >= reviewPageCount} onClick={() => setReviewPage((page) => page + 1)}>
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
          )}
        </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <Dialog open={mobilePanel === "media"} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent raw className="overflow-y-auto p-0">
            {detailContent}
            <div className="border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 w-full"
                onClick={() => {
                  setReviewView(resenas.length > 0 ? "list" : "form")
                  setMobilePanel("reviews")
                }}
              >
                Ver reseñas ({evento.rating_count})
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={mobilePanel === "reviews"} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent raw className="overflow-y-auto p-0">
            {detailContent}
            <div className="border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 w-full"
                onClick={() => setMobilePanel("media")}
              >
                Ver fotos y videos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent raw className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-5xl lg:overflow-hidden">
        {detailContent}
      </DialogContent>
    </Dialog>
  )
}