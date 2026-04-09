"use client"

import { BookOpen, Clock, GraduationCap, Layers, Pencil, Play, Search, User } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCursos, type Curso } from "@/lib/hooks"

// ── Helpers ───────────────────────────────────────────────────────────────────

function CursoSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="h-2 bg-primary/20" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function CursoCard({ curso, onPlay, onEdit }: { curso: Curso; onPlay: () => void; onEdit: () => void }) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="h-1.5 bg-primary" />
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1 space-y-1.5">
          <h3 className="font-semibold text-sm sm:text-base leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
            {curso.title}
          </h3>
          {curso.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {curso.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {curso.category && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              {curso.category}
            </Badge>
          )}
          {curso.tipo && (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              {curso.tipo}
            </Badge>
          )}
          {!curso.published && (
            <Badge variant="outline" className="text-[10px] px-2 py-0 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
              Borrador
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2.5 mt-auto">
          <div className="flex items-center gap-3">
            {curso.instructor && (
              <span className="flex items-center gap-1">
                <User size={11} />
                <span className="truncate max-w-[100px]">{curso.instructor}</span>
              </span>
            )}
            {curso.duration && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {curso.duration}
              </span>
            )}
            {curso.slide_count > 0 && (
              <span className="flex items-center gap-1">
                <Layers size={11} />
                {curso.slide_count} slides
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 rounded-full"
              title="Editar curso"
              onClick={e => { e.stopPropagation(); onEdit() }}
            >
              <Pencil size={12} className="text-gray-400" />
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 rounded-full"
              title="Ver curso"
              onClick={e => { e.stopPropagation(); onPlay() }}
            >
              <Play size={13} className="text-primary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PresentacionesContent() {
  const router = useRouter()
  const { cursos, loading, error } = useCursos()
  const [search, setSearch] = useState("")

  const filtered = cursos.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.instructor ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.category ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const totalSlides = cursos.reduce((acc, c) => acc + (c.slide_count ?? 0), 0)
  const published   = cursos.filter(c => c.published).length

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">

      {/* Hero */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="relative overflow-hidden lg:col-span-8">
          <div className="hero-motion-bg" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/65 to-white/20 dark:from-gray-900/90 dark:via-gray-900/65 dark:to-gray-900/25" aria-hidden="true" />
          <CardContent className="relative min-h-[200px] sm:min-h-[240px] p-5 sm:p-8 flex flex-col justify-end">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
              VIÑOPLASTIC
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Instructores Internos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cursos nativos creados por el equipo
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-3">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <BookOpen size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cursos.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cursos totales</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-2">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <GraduationCap size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{published}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Publicados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-2">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Layers size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSlides}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Slides totales</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Buscar cursos..."
          className="pl-8 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de cursos */}
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">Error al cargar cursos: {error}</p>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CursoSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <BookOpen size={36} strokeWidth={1.2} />
          <p className="text-sm">{search ? "Sin resultados para tu búsqueda" : "No hay cursos disponibles"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(curso => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onPlay={() => router.push(`/presentaciones/${curso.id}`)}
              onEdit={() => router.push(`/presentaciones/${curso.id}/editar`)}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .hero-motion-bg {
          position: absolute;
          inset: -12%;
          background-image: url("/HERO.png");
          background-size: cover;
          background-position: center;
          opacity: 0.95;
          transform: scale(1.02);
          animation: hero-pan 16s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes hero-pan {
          0%   { transform: translate3d(-1.5%, -1%, 0) scale(1.02); }
          100% { transform: translate3d(1.5%,  1%, 0) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-motion-bg { animation: none; transform: scale(1.02); }
        }
      `}</style>
    </section>
  )
}
