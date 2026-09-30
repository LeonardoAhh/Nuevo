"use client"

import { useState } from "react"
import { useRole } from "@/lib/hooks"
import { useEventosPublicos, type EventoWithAggregates } from "@/lib/hooks/useEventos"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EventosGallery } from "./eventos-gallery"
import { EventoDetalle } from "./evento-detalle"
import { EventosAdminPanel } from "./admin-panel"

export function EventosLanding() {
  const { canEdit } = useRole()
  const { eventos, loading, error, recargar } = useEventosPublicos()
  const [selected, setSelected] = useState<EventoWithAggregates | null>(null)
  const [view, setView] = useState<"gallery" | "admin">("gallery")

  const selectedLive = selected
    ? eventos.find((evento) => evento.id === selected.id) ?? null
    : null
  const totalArchivos = eventos.reduce((total, evento) => total + evento.fotos.length, 0)
  const totalResenas = eventos.reduce((total, evento) => total + evento.rating_count, 0)

  return (
    <div className="space-y-6">
      <section aria-labelledby="eventos-heading" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Mural</p>
            <h2 id="eventos-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Momentos de la planta
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Explora las fotos y videos de nuestros eventos y comparte tu reseña.
            </p>
          </div>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              aria-pressed={view === "admin"}
              onClick={() => {
                setSelected(null)
                setView((current) => current === "gallery" ? "admin" : "gallery")
              }}
            >
              {view === "gallery" ? "Administrar" : "Ver galería"}
            </Button>
          )}
        </div>

        {view === "gallery" && !loading && !error && eventos.length > 0 && (
          <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card py-4">
            <div className="px-3 text-center sm:px-5">
              <dt className="text-xs text-muted-foreground">Eventos</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{eventos.length}</dd>
            </div>
            <div className="px-3 text-center sm:px-5">
              <dt className="text-xs text-muted-foreground">Archivos</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{totalArchivos}</dd>
            </div>
            <div className="px-3 text-center sm:px-5">
              <dt className="text-xs text-muted-foreground">Reseñas</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{totalResenas}</dd>
            </div>
          </dl>
        )}
      </section>

      {view === "gallery" ? (
        <section aria-labelledby="galeria-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="galeria-heading" className="text-base font-semibold text-foreground">Galería</h2>
            <p className="text-sm text-muted-foreground">Selecciona un evento para ver su galería y reseñas.</p>
          </div>

          {loading ? (
            <div role="status" aria-label="Cargando eventos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              No se pudieron cargar los eventos. {error}
            </div>
          ) : (
            <EventosGallery eventos={eventos} onSelect={setSelected} />
          )}
        </section>
      ) : canEdit ? (
        <EventosAdminPanel eventos={eventos} onChange={recargar} />
      ) : null}

      <EventoDetalle
        evento={selectedLive}
        onClose={() => setSelected(null)}
        onChange={recargar}
      />
    </div>
  )
}
