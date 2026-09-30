"use client"

import { CalendarDays, Image as ImageIcon, Play } from "lucide-react"
import { StarRating } from "./star-rating"
import { eventoPublicUrl, isVideoPath, type EventoWithAggregates } from "@/lib/hooks/useEventos"

interface EventosGalleryProps {
  eventos: EventoWithAggregates[]
  onSelect: (evento: EventoWithAggregates) => void
}

export function EventosGallery({ eventos, onSelect }: EventosGalleryProps) {
  if (eventos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <ImageIcon size={24} className="mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-foreground">Aún no hay eventos publicados</p>
        <p className="mt-1 text-sm text-muted-foreground">Los nuevos eventos aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {eventos.map((evento) => (
        <li key={evento.id} className="min-w-0">
          <EventoCard evento={evento} onSelect={() => onSelect(evento)} />
        </li>
      ))}
    </ul>
  )
}

function EventoCard({ evento, onSelect }: { evento: EventoWithAggregates; onSelect: () => void }) {
  const coverPath = evento.cover_path ?? evento.fotos[0]?.storage_path ?? null
  const coverUrl = eventoPublicUrl(coverPath)
  const isVideo = coverUrl ? isVideoPath(coverUrl) : false
  const fecha = evento.fecha
    ? new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-MX", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
        {coverUrl ? (
          isVideo ? (
            <video src={coverUrl} preload="metadata" muted playsInline aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="flex h-full items-center justify-center">
            <ImageIcon size={28} className="text-muted-foreground" aria-hidden="true" />
          </span>
        )}
        {isVideo && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Play size={20} className="rounded-md bg-background/90 p-1 text-foreground" />
          </span>
        )}
      </span>
      <span className="flex w-full flex-1 flex-col gap-3 p-4">
        <span className="line-clamp-2 text-sm font-semibold text-foreground">{evento.titulo}</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {fecha && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} aria-hidden="true" />{fecha}
            </span>
          )}
          <span>{evento.fotos.length} archivo{evento.fotos.length === 1 ? "" : "s"}</span>
        </span>
        <span className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <StarRating value={evento.rating_avg ?? 0} size={12} readOnly />
          <span>{evento.rating_avg != null ? evento.rating_avg.toFixed(1) : "Sin reseñas"}</span>
          {evento.rating_count > 0 && <span aria-label={evento.rating_count + " reseñas"}>({evento.rating_count})</span>}
        </span>
      </span>
    </button>
  )
}
