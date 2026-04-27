"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Image as ImageIcon, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { StarRating } from "./star-rating"
import { eventoPublicUrl, type EventoWithAggregates } from "@/lib/hooks/useEventos"

interface Props {
  eventos: EventoWithAggregates[]
  onSelect: (ev: EventoWithAggregates) => void
  speed?: number // px/sec
}

const GAP_PX = 16 // tailwind `gap-4`

/**
 * Auto-scrolling horizontal marquee of event cards.
 *
 * - When the cards don't fill the viewport we render them once, centered, and
 *   skip the marquee entirely (no visual duplication).
 * - When they do fill it we render the list twice side-by-side and translate
 *   the track with rAF so the loop is seamless.
 * - Pauses on hover / touch and respects `prefers-reduced-motion`.
 */
export function EventoCarousel({ eventos, onSelect, speed = 28 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [reduced, setReduced] = useState(false)

  const setPaused = (v: boolean) => {
    pausedRef.current = v
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const measure = () => {
      setContainerWidth(container.offsetWidth)
      setContentWidth(content.offsetWidth)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    ro.observe(content)
    measure()
    return () => ro.disconnect()
  }, [eventos])

  // "marquee" once the single-copy content is wide enough to actually scroll
  // past the viewport. Give ourselves a small safety margin so we don't flicker
  // between modes on borderline sizes.
  const shouldMarquee = contentWidth > containerWidth + 8

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (!shouldMarquee || reduced) {
      // Reset so static mode shows the cards at x=0
      track.style.transform = "translate3d(0, 0, 0)"
      return
    }

    let raf = 0
    let last = performance.now()
    let offset = 0
    const period = contentWidth + GAP_PX // one full copy + the gap to the next

    // Read paused from a ref so hover/unhover doesn't tear down the effect
    // and reset the scroll offset to 0.
    const step = (now: number) => {
      // Cap dt so a backgrounded tab (where rAF pauses) doesn't produce a
      // huge jump on return. Then use modulo to normalize the offset.
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (!pausedRef.current) {
        offset = (offset + speed * dt) % period
        track.style.transform = `translate3d(${-offset}px, 0, 0)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [shouldMarquee, contentWidth, speed, reduced])

  if (eventos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
        <ImageIcon size={28} className="mx-auto text-muted-foreground/60" />
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no hay eventos publicados.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Edge fades only make sense when the marquee is actually scrolling. */}
      {shouldMarquee && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />
        </>
      )}

      <div
        ref={trackRef}
        className={cn(
          "flex gap-4 will-change-transform px-5 sm:px-8",
          !shouldMarquee && "justify-center",
        )}
      >
        <div ref={contentRef} className="flex gap-4 shrink-0">
          {eventos.map((ev) => (
            <EventoCard
              key={`a-${ev.id}`}
              evento={ev}
              onClick={() => onSelect(ev)}
            />
          ))}
        </div>
        {shouldMarquee && (
          <div className="flex gap-4 shrink-0" aria-hidden>
            {eventos.map((ev) => (
              <EventoCard
                key={`b-${ev.id}`}
                evento={ev}
                onClick={() => onSelect(ev)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  evento: EventoWithAggregates
  onClick: () => void
}

function EventoCard({ evento, onClick }: CardProps) {
  const coverPath = evento.cover_path ?? evento.fotos[0]?.storage_path ?? null
  const coverUrl = eventoPublicUrl(coverPath)
  const fecha = evento.fecha
    ? new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-MX", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group relative shrink-0 w-[280px] sm:w-[320px] rounded-xl overflow-hidden",
        "border border-border/60 bg-card text-left",
        "shadow-sm hover:shadow-md hover:border-primary/40 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="relative aspect-[4/3] bg-muted/40 overflow-hidden">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={evento.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon size={28} className="text-muted-foreground/40" />
          </div>
        )}
        {evento.fotos.length > 1 && (
          <span className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
            <ImageIcon size={11} /> {evento.fotos.length}
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="font-semibold text-sm truncate">{evento.titulo}</p>
        {fecha && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar size={11} /> {fecha}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <StarRating value={evento.rating_avg ?? 0} size={12} readOnly />
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            {evento.rating_avg != null ? (
              <>
                <Star size={10} className="fill-warning text-warning" />
                {evento.rating_avg.toFixed(1)} · {evento.rating_count}
              </>
            ) : (
              <>Sin reseñas</>
            )}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
