"use client"

import {
  ArrowLeft, ChevronLeft, ChevronRight, Layers, Maximize2,
  Minimize2, PanelLeft, Pencil, User, Clock,
} from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurso, useSlides, type Slide } from "@/lib/hooks"
import { cn } from "@/lib/utils"

// ── Slide renderer ────────────────────────────────────────────────────────────

function SlideView({ slide, isFullscreen }: { slide: Slide; isFullscreen: boolean }) {
  const d = slide.data ?? {}
  const title  = d.title  as string | undefined
  const subtitle = d.subtitle as string | undefined
  const body   = d.body   as string | undefined
  const items  = d.items  as string[] | undefined
  const imageUrl = d.url  as string | undefined
  const caption  = d.caption as string | undefined
  const quoteText = d.text as string | undefined
  const author = d.author as string | undefined
  const videoUrl = d.videoUrl as string | undefined

  const base = cn(
    "flex flex-col items-center justify-center h-full w-full p-8 sm:p-12 lg:p-16 gap-4 text-center select-none",
    isFullscreen && "sm:p-20"
  )

  switch (slide.type) {
    case "title":
      return (
        <div className={base}>
          {title && <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-gray-50 leading-tight">{title}</h1>}
          {subtitle && <p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )

    case "image":
      return (
        <div className="flex flex-col h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imageUrl && <img src={imageUrl} alt={title ?? ""} className="flex-1 w-full object-contain" />}
          {(title || caption) && (
            <div className="p-4 text-center space-y-1">
              {title && <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">{title}</p>}
              {caption && <p className="text-xs text-gray-500 dark:text-gray-400">{caption}</p>}
            </div>
          )}
        </div>
      )

    case "video":
      return (
        <div className={cn(base, "gap-3")}>
          {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{title}</h2>}
          {videoUrl && (
            <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe src={videoUrl} className="w-full h-full" allowFullScreen />
            </div>
          )}
        </div>
      )

    case "bullets":
    case "list":
      return (
        <div className={cn(base, "items-start text-left")}>
          {title && <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2 self-center">{title}</h2>}
          <ul className="space-y-3 max-w-xl w-full">
            {(items ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )

    case "quote":
      return (
        <div className={base}>
          <blockquote className="max-w-2xl">
            <p className="text-2xl sm:text-3xl font-medium text-gray-800 dark:text-gray-100 italic leading-relaxed">
              &ldquo;{quoteText}&rdquo;
            </p>
            {author && <footer className="mt-4 text-sm text-gray-500 dark:text-gray-400">— {author}</footer>}
          </blockquote>
        </div>
      )

    case "content":
    default:
      return (
        <div className={cn(base, "items-start text-left")}>
          {title && <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 self-center">{title}</h2>}
          {body && (
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl whitespace-pre-line">
              {body}
            </p>
          )}
        </div>
      )
  }
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

function SlideThumbnail({ slide, index, active, onClick }: {
  slide: Slide; index: number; active: boolean; onClick: () => void
}) {
  const d = slide.data ?? {}
  const title = (d.title ?? d.text ?? `Slide ${index + 1}`) as string
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <span className={cn(
        "shrink-0 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold",
        active ? "bg-primary text-primary-foreground" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
      )}>
        {index + 1}
      </span>
      <span className="truncate">{title}</span>
    </button>
  )
}

// ── Player ────────────────────────────────────────────────────────────────────

export default function CoursePlayer({ id }: { id: string }) {
  const router = useRouter()
  const { curso, loading: loadingCurso } = useCurso(id)
  const { slides, loading: loadingSlides } = useSlides(id)

  const [current, setCurrent] = useState(0)
  const [showPanel, setShowPanel] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const total = slides.length
  const canPrev = current > 0
  const canNext = current < total - 1

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next()
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev()
      if (e.key === "Escape") router.back()
      if (e.key === "f" || e.key === "F") toggleFullscreen()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [next, prev, router])

  // Fullscreen API
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const loading = loadingCurso || loadingSlides

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-950" : "h-[calc(100vh-8.5rem)] min-h-[500px]"
      )}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowPanel(v => !v)}>
            <PanelLeft size={16} />
          </Button>
          {curso && (
            <div className="flex items-center gap-2 ml-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px] sm:max-w-sm">
                {curso.title}
              </span>
              {curso.category && (
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{curso.category}</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {curso && (
            <Button
              variant="ghost" size="sm" className="h-8 gap-1.5 text-xs hidden sm:flex"
              onClick={() => router.push(`/presentaciones/${id}/editar`)}
            >
              <Pencil size={13} />
              Editar
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleFullscreen} title="Pantalla completa (F)">
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Panel de slides */}
        {showPanel && (
          <aside className="w-52 shrink-0 border-r dark:border-gray-800 flex flex-col overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
            <div className="p-2 space-y-0.5">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  ))
                : slides.map((s, i) => (
                    <SlideThumbnail key={s.id} slide={s} index={i} active={i === current} onClick={() => setCurrent(i)} />
                  ))
              }
            </div>
          </aside>
        )}

        {/* Slide principal */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
          <div className="flex-1 flex items-center justify-center overflow-hidden relative">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Layers size={40} strokeWidth={1} className="animate-pulse" />
                <p className="text-sm">Cargando slides...</p>
              </div>
            ) : total === 0 ? (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Layers size={40} strokeWidth={1} />
                <p className="text-sm">Este curso no tiene slides</p>
              </div>
            ) : (
              <SlideView slide={slides[current]} isFullscreen={isFullscreen} />
            )}
          </div>

          {/* Barra de progreso */}
          {total > 0 && (
            <div className="h-1 bg-gray-100 dark:bg-gray-800 shrink-0">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((current + 1) / total) * 100}%` }}
              />
            </div>
          )}

          {/* Controles de navegación */}
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-800 shrink-0">
            <Button variant="outline" size="sm" onClick={prev} disabled={!canPrev} className="gap-1.5">
              <ChevronLeft size={16} />
              Anterior
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {total > 0 ? `${current + 1} / ${total}` : "—"}
            </span>
            <Button variant="outline" size="sm" onClick={next} disabled={!canNext} className="gap-1.5">
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </main>
      </div>

      {/* Meta del curso (footer pequeño en fullscreen) */}
      {isFullscreen && curso && (
        <div className="flex items-center gap-4 px-4 py-2 border-t dark:border-gray-800 text-[11px] text-gray-400 shrink-0">
          {curso.instructor && (
            <span className="flex items-center gap-1"><User size={11} />{curso.instructor}</span>
          )}
          {curso.duration && (
            <span className="flex items-center gap-1"><Clock size={11} />{curso.duration}</span>
          )}
        </div>
      )}
    </div>
  )
}
