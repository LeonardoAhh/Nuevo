"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, MessageSquare, Sparkles, Star } from "lucide-react"
import { useRole } from "@/lib/hooks"
import { useEventosPublicos, type EventoWithAggregates } from "@/lib/hooks/useEventos"
import { EventoCarousel } from "./evento-carousel"
import { EventoDetalle } from "./evento-detalle"
import { EventosAdminPanel } from "./admin-panel"
import { StarRating } from "./star-rating"

export function EventosLanding() {
  const { canEdit } = useRole()
  const { eventos, loading, error, recargar } = useEventosPublicos()
  const [selected, setSelected] = useState<EventoWithAggregates | null>(null)

  // Re-sincroniza el detalle cuando cambian los eventos (p. ej. tras subir foto).
  const selectedLive = selected
    ? eventos.find((e) => e.id === selected.id) ?? null
    : null

  const totalFotos = eventos.reduce((acc, e) => acc + e.fotos.length, 0)
  const totalResenas = eventos.reduce((acc, e) => acc + e.rating_count, 0)
  const globalAvg = (() => {
    let sum = 0
    let count = 0
    for (const e of eventos) {
      if (e.rating_avg != null) {
        sum += e.rating_avg * e.rating_count
        count += e.rating_count
      }
    }
    return count > 0 ? sum / count : null
  })()

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_65%)]"
      />

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-10 sm:px-8 sm:pt-20 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
            <Sparkles size={12} /> Mural de eventos
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Momentos que vivimos juntos en la empresa
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Explora las fotos de nuestras celebraciones, deja tu reseña y califica con estrellas.
            Actualizamos el mural con cada evento.
          </p>

          {eventos.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Calendar size={14} />{" "}
                <strong className="text-foreground">{eventos.length}</strong> evento
                {eventos.length !== 1 ? "s" : ""}
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles size={14} />{" "}
                <strong className="text-foreground">{totalFotos}</strong> foto
                {totalFotos !== 1 ? "s" : ""}
              </li>
              <li className="flex items-center gap-1.5">
                <MessageSquare size={14} />{" "}
                <strong className="text-foreground">{totalResenas}</strong> reseña
                {totalResenas !== 1 ? "s" : ""}
              </li>
              {globalAvg != null && (
                <li className="flex items-center gap-1.5">
                  <Star size={14} className="fill-warning text-warning" />
                  <strong className="text-foreground">{globalAvg.toFixed(1)}</strong>
                  <span className="text-xs">promedio</span>
                </li>
              )}
            </ul>
          )}
        </motion.div>
      </section>

      {/* Carousel */}
      <section className="pb-10 sm:pb-16">
        {loading ? (
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-[280px] sm:w-[320px] rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-muted/50 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-2/3 bg-muted/60 rounded animate-pulse" />
                    <div className="h-2.5 w-1/2 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
              Error al cargar eventos: {error}
            </div>
          </div>
        ) : (
          <EventoCarousel eventos={eventos} onSelect={setSelected} speed={28} />
        )}
      </section>

      {/* Resumen / CTA */}
      {eventos.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-10 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Toca cualquier foto para ver más
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Dentro de cada evento encuentras la galería completa y puedes dejar tu reseña anónima
                con calificación de 1 a 5 estrellas. Tu opinión es pública.
              </p>
            </div>
            {globalAvg != null && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
                <StarRating value={globalAvg} size={18} readOnly />
                <div className="text-sm">
                  <p className="font-semibold">{globalAvg.toFixed(1)} / 5</p>
                  <p className="text-xs text-muted-foreground">
                    {totalResenas} reseña{totalResenas !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* Admin (solo dev) */}
      {canEdit && (
        <section className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-10 sm:pb-16">
          <EventosAdminPanel eventos={eventos} onChange={recargar} />
        </section>
      )}

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-10 border-t border-border/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Capacitación Planta Qro.</p>
          <div className="flex items-center gap-4">
            <Link href="/recursos" className="hover:text-foreground transition">
              Recursos
            </Link>
            <Link href="/bot" className="hover:text-foreground transition">
              Bot WhatsApp
            </Link>
          </div>
        </div>
      </footer>

      <EventoDetalle
        evento={selectedLive}
        onClose={() => setSelected(null)}
        onChange={recargar}
      />
    </main>
  )
}
