"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ExternalLink,
  QrCode,
  Search,
  Share2,
  X,
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

function getQrUrl(url: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=8`
}

function copyToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return
  navigator.clipboard.writeText(text).then(
    () => notify.success("Enlace copiado al portapapeles"),
    () => notify.error("No se pudo copiar el enlace"),
  )
}

function CursoCover({ curso }: { curso: CursoPublico }) {
  const category = detectarCategoria(curso.nombre)
  const tone = getToneClasses(category.tone)
  const CategoryIcon = category.icon ?? GraduationCap

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundImage: tone.gradient }}
    >
      <CategoryIcon
        className="pointer-events-none absolute -right-6 -bottom-6 h-36 w-36 text-white/15 sm:h-40 sm:w-40"
        strokeWidth={1.25}
      />
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-black/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      <div className="relative flex h-40 flex-col justify-between p-4 sm:h-44 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/25 shadow-sm ring-1 ring-white/30 backdrop-blur-sm sm:h-11 sm:w-11">
            <CategoryIcon size={20} className="text-white sm:hidden" strokeWidth={2.25} />
            <CategoryIcon size={22} className="hidden text-white sm:block" strokeWidth={2.25} />
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
            {category.label}
          </span>
        </div>

        <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
            {category.label}
          </p>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white sm:text-[17px]">
            {curso.nombre}
          </h3>
        </div>
      </div>
    </div>
  )
}

function CursoCardList({
  curso,
  onShowQr,
}: {
  curso: CursoPublico
  onShowQr: () => void
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CursoCover curso={curso} />

      <div className="flex flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {curso.nombre}
          </h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {curso.descripcion ?? "Sin descripción disponible."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="default" className="h-10 w-full" asChild>
            <a href={curso.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              <span className="ml-2">Ir al curso</span>
            </a>
          </Button>
          <Button variant="outline" className="h-10 w-full" onClick={onShowQr}>
            <QrCode size={16} />
            <span className="ml-2">QR</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-background p-8 text-center sm:rounded-3xl sm:p-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-16 sm:w-16">
        <Info size={22} />
      </div>
      <p className="text-sm font-semibold text-foreground">No se encontraron cursos</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasQuery
          ? "Ajusta tu búsqueda para encontrar el curso que necesitas."
          : "No hay cursos públicos activos disponibles en este momento."}
      </p>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex h-full flex-col overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none sm:h-44" />
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function QrDialog({
  curso,
  open,
  onOpenChange,
}: {
  curso: CursoPublico | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!curso) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>QR del curso</DialogTitle>
          <DialogDescription>
            Escanea el código QR con tu teléfono o copia el enlace para abrir el curso.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-center">
          <img
            src={getQrUrl(curso.url, 280)}
            alt={`QR de ${curso.nombre}`}
            className="mx-auto rounded-3xl border border-border bg-white p-3"
          />
          <p className="break-all text-sm text-muted-foreground">{curso.url}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button className="w-full sm:w-auto" onClick={() => copyToClipboard(curso.url)}>
              <Share2 size={16} />
              <span className="ml-2">Copiar enlace</span>
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
              <span className="ml-2">Cerrar</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function RecursosHome() {
  const { cursos, loading, error } = useCursosPublicos(true)
  const [query, setQuery] = useState("")
  const [qrTarget, setQrTarget] = useState<CursoPublico | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (error) notify.error(`Error al cargar cursos: ${error}`)
  }, [error])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cursos
    return cursos.filter(
      (curso) =>
        curso.nombre.toLowerCase().includes(q) ||
        (curso.descripcion ?? "").toLowerCase().includes(q),
    )
  }, [cursos, query])

  const hasQuery = query.trim().length > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-4 sm:h-14 sm:gap-3 sm:px-6">
          <span className="text-base font-bold tracking-tight sm:text-xl">
            <span className="text-primary">VIÑO</span>
            <span className="text-foreground">PLASTIC</span>
          </span>
          <span className="hidden text-muted-foreground sm:inline">·</span>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            Material Cursos Capacitación Planta Querétaro
          </span>
        </div>
      </header>

      {/* ─── HERO compacto ─── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_15%_0%,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(40%_60%_at_100%_100%,hsl(var(--primary)/0.06),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              {/* Eyebrow + contador inline en móvil */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="uppercase tracking-[0.18em]">Capacitación</span>
                </div>
                {!loading && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground sm:hidden">
                    <span className="inline-block h-1 w-1 rounded-full bg-border" />
                    <span className="font-semibold text-foreground">{cursos.length}</span>
                    {cursos.length === 1 ? "curso" : "cursos"}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Planta Querétaro
              </h1>
              <p className="hidden max-w-xl text-sm text-muted-foreground sm:block">
                Material de cursos disponible para el personal. Aprende a tu ritmo y valida
                tu avance en el departamento de Capacitación.
              </p>
            </div>

            {/* Pill de contador solo en desktop */}
            {!loading && (
              <div className="hidden items-center gap-2 self-start rounded-full border border-border bg-card px-3.5 py-1.5 text-xs shadow-sm sm:inline-flex sm:self-end">
                <GraduationCap size={14} className="text-primary" />
                <span className="font-semibold text-foreground">{cursos.length}</span>
                <span className="text-muted-foreground">
                  {cursos.length === 1 ? "curso disponible" : "cursos disponibles"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Search sticky ─── */}
      <div className="sticky top-12 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:top-14">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-4">
          <div className="group flex h-12 items-center gap-2 rounded-xl border border-border bg-card pl-3 pr-2 shadow-sm transition focus-within:border-primary/60 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20 sm:h-11">
            <Search
              size={18}
              className="shrink-0 text-muted-foreground transition group-focus-within:text-primary sm:hidden"
            />
            <Search
              size={16}
              className="hidden shrink-0 text-muted-foreground transition group-focus-within:text-primary sm:block"
            />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar curso..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar curso"
              className="h-full border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
            />

            {hasQuery ? (
              <>
                <span className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:inline">
                  <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "resultado" : "resultados"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-md sm:h-7 sm:w-7"
                  onClick={() => {
                    setQuery("")
                    searchInputRef.current?.focus()
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              <kbd className="hidden h-6 shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            )}
          </div>

          {/* Contador de resultados en móvil (debajo del input) */}
          {hasQuery && (
            <p className="mt-2 text-xs text-muted-foreground sm:hidden">
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "resultado" : "resultados"} de{" "}
              <span className="font-medium">{cursos.length}</span>
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
        {/* ─── Callout Nota importante ─── */}
        <div
          role="note"
          aria-label="Nota importante"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50/80 px-3 py-2.5 shadow-sm dark:bg-amber-500/10 sm:mb-6 sm:gap-3 sm:px-4 sm:py-3"
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Info size={14} />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 sm:text-xs">
              Nota importante
            </p>
            <p className="text-xs leading-relaxed text-foreground/85 sm:text-sm">
              Al visualizar un curso en línea, recuerda presentarte en el departamento de{" "}
              <span className="font-semibold text-foreground">Capacitación</span> para
              realizar el examen correspondiente.
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={hasQuery} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3"
            >
              {filtered.map((curso, index) => (
                <motion.div
                  key={curso.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                  className="h-full"
                >
                  <CursoCardList curso={curso} onShowQr={() => setQrTarget(curso)} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="mt-8 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1.5 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:gap-2 sm:px-6 sm:py-5 sm:text-xs">
          <span className="font-semibold">
            <span className="text-primary">VIÑO</span>PLASTIC
          </span>
          <span>© {new Date().getFullYear()} · Sistema de Capacitación</span>
        </div>
      </footer>

      <QrDialog
        curso={qrTarget}
        open={Boolean(qrTarget)}
        onOpenChange={(open) => !open && setQrTarget(null)}
      />
    </div>
  )
}