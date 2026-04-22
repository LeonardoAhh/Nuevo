"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ExternalLink,
  QrCode,
  Search,
  Share2,
  Download,
  X,
  Sparkles,
  GraduationCap,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useCursosPublicos, type CursoPublico } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import { detectarCategoria, getToneClasses } from "@/lib/constants/cursos-categorias"

// ─── QR helper ────────────────────────────────────────────────────────────────

function getQrUrl(url: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=8`
}

// ─── Cover semántico (sin imagen externa random) ──────────────────────────────

function CursoCover({
  curso,
  className,
  showBadge = true,
  iconSize = 64,
}: {
  curso: CursoPublico
  className?: string
  showBadge?: boolean
  iconSize?: number
}) {
  // Imagen propia subida por admin
  if (curso.imagen_url) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={curso.imagen_url}
          alt={curso.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>
    )
  }

  // Fallback: gradiente + icono semántico por categoría detectada del nombre
  const cat = detectarCategoria(curso.nombre)
  const tone = getToneClasses(cat.tone)
  const Icon = cat.icon

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${tone.gradient} ${className ?? ""}`}
    >
      {/* Patrón decorativo grande en esquina */}
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
        <Icon
          className={`absolute -right-6 -bottom-6 ${tone.patternColor}`}
          size={Math.round(iconSize * 2.8)}
          strokeWidth={1}
        />
      </div>
      {/* Icono central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className={`${tone.iconColor} drop-shadow-lg`}
          size={iconSize}
          strokeWidth={1.5}
        />
      </div>
      {/* Badge categoría */}
      {showBadge && (
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-background/90 backdrop-blur text-foreground/80 uppercase tracking-wide">
            {cat.label}
          </span>
        </div>
      )}
      {/* Overlay para legibilidad del título */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RecursosPage() {
  const { cursos, loading } = useCursosPublicos(true)
  const [query, setQuery] = useState("")
  const [qrTarget, setQrTarget] = useState<CursoPublico | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cursos
    return cursos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion ?? "").toLowerCase().includes(q),
    )
  }, [cursos, query])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ── */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="text-lg sm:text-xl font-bold tracking-tight">
            <span className="text-primary">VIÑO</span>
            <span className="text-foreground">PLASTIC</span>
          </span>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Material Cursos Capacitación Planta Querétaro
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <GraduationCap size={28} className="text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                <Sparkles size={12} />
                <span>Aprende a tu ritmo</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Capacitación Planta Querétaro
              </h1>
              {!loading && (
                <p className="text-xs text-muted-foreground pt-1">
                  <span className="font-semibold text-foreground">
                    {cursos.length}
                  </span>{" "}
                  {cursos.length === 1 ? "curso disponible" : "cursos disponibles"}
                </p>
              )}

              {/* ── Nota ── */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Nota importante
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Al visualizar el curso en línea, debes presentarte al departamento de{" "}
                    <span className="font-semibold text-foreground">Capacitación</span>{" "}
                    para realizar el examen correspondiente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      </section>

      {/* ── Toolbar (sticky) ── */}
      <div className="sticky top-14 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Buscar curso..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-muted border-0"
            />
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={!!query.trim()} onClear={() => setQuery("")} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="flex flex-col gap-3">
              {filtered.map((curso, i) => (
                <motion.div
                  key={curso.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                >
                  <CursoCardList curso={curso} onShowQr={() => setQrTarget(curso)} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold">
            <span className="text-primary">VIÑO</span>PLASTIC
          </span>
          <span>© {new Date().getFullYear()} · Sistema de Capacitación</span>
        </div>
      </footer>

      {/* ── QR Modal ── */}
      <QrDialog curso={qrTarget} onClose={() => setQrTarget(null)} />
    </div>
  )
}

// ─── Card: grid ──────────────────────────────────────────────────────────────

function CursoCardGrid({
  curso,
  onShowQr,
}: {
  curso: CursoPublico
  onShowQr: () => void
}) {
  return (
    <Card className="group flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/60">
      {/* Cover semántico (icono por categoría o imagen propia) */}
      <div className="relative">
        <CursoCover curso={curso} className="aspect-[16/9]" iconSize={72} />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none">
          <h3 className="text-white font-semibold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow">
            {curso.nombre}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {curso.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {curso.descripcion}
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <Button asChild className="flex-1 gap-2">
            <a href={curso.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
              Ver curso
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShowQr}
            aria-label="Ver código QR"
            title="Ver código QR"
          >
            <QrCode size={15} />
          </Button>
          <ShareButton curso={curso} />
        </div>
      </div>
    </Card>
  )
}

// ─── Card: list ──────────────────────────────────────────────────────────────

function CursoCardList({
  curso,
  onShowQr,
}: {
  curso: CursoPublico
  onShowQr: () => void
}) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all border-border/60">
      <div className="flex items-stretch gap-0">
        {/* Thumbnail */}
        <CursoCover
          curso={curso}
          className="w-28 sm:w-40 shrink-0"
          showBadge={false}
          iconSize={36}
        />

        {/* Body */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-1">
              {curso.nombre}
            </h3>
            {curso.descripcion && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {curso.descripcion}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button asChild size="sm" className="gap-1.5">
              <a href={curso.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Ver curso</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onShowQr}
              aria-label="Ver QR"
            >
              <QrCode size={14} />
            </Button>
            <ShareButton curso={curso} compact />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Share button ────────────────────────────────────────────────────────────

function ShareButton({ curso, compact }: { curso: CursoPublico; compact?: boolean }) {
  const handleShare = async () => {
    if (typeof navigator === "undefined") return
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>
    }
    try {
      if (typeof nav.share === "function") {
        await nav.share({
          title: curso.nombre,
          text: curso.descripcion ?? curso.nombre,
          url: curso.url,
        })
      } else {
        await nav.clipboard.writeText(curso.url)
        notify.success("Enlace copiado")
      }
    } catch {
      // user cancelled share — ignore
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={compact ? "h-8 w-8" : ""}
      onClick={handleShare}
      aria-label="Compartir"
      title="Compartir"
    >
      <Share2 size={compact ? 14 : 15} />
    </Button>
  )
}

// ─── QR Dialog ───────────────────────────────────────────────────────────────

function QrDialog({
  curso,
  onClose,
}: {
  curso: CursoPublico | null
  onClose: () => void
}) {
  const handleDownload = () => {
    if (!curso) return
    const link = document.createElement("a")
    link.href = getQrUrl(curso.url, 600)
    link.download = `qr-${curso.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={!!curso} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">{curso?.nombre}</DialogTitle>
          <DialogDescription>
            Escanea con tu cámara para acceder al curso
          </DialogDescription>
        </DialogHeader>

        {curso && (
          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="rounded-xl bg-white p-4 shadow-sm border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getQrUrl(curso.url, 280)}
                alt={`QR para ${curso.nombre}`}
                width={280}
                height={280}
                className="block"
              />
            </div>

            <div className="w-full flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDownload}
              >
                <Download size={14} />
                Descargar
              </Button>
              <Button asChild className="flex-1 gap-2">
                <a href={curso.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton list ───────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex">
            <Skeleton className="w-28 sm:w-40 h-20 sm:h-24 rounded-none" />
            <div className="flex-1 p-3 sm:p-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  hasQuery,
  onClear,
}: {
  hasQuery: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center space-y-4">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
        {hasQuery ? (
          <Search size={36} className="text-muted-foreground/50" />
        ) : (
          <QrCode size={36} className="text-muted-foreground/50" />
        )}
      </div>
      <div className="space-y-1">
        <p className="font-semibold">
          {hasQuery ? "Sin resultados" : "No hay recursos disponibles"}
        </p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {hasQuery
            ? "Intenta con otro término de búsqueda."
            : "Pronto se publicarán nuevos cursos. Vuelve más tarde."}
        </p>
      </div>
      {hasQuery && (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
          <X size={14} />
          Limpiar búsqueda
        </Button>
      )}
    </div>
  )
}
