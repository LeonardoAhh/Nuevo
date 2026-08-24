"use client"

import { useEffect, useState, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Printer, AlertCircle, Save, Loader2, Sparkles, ClipboardList, FolderOpen, X, Clock, CalendarX2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDesempeno } from "@/lib/hooks/useDesempeno"
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo"
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad"
import {
  DEFAULT_OBJETIVOS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_CUMPLIMIENTO_POR_TIPO,
  DEFAULT_COMPETENCIAS_POR_TIPO,
  UMBRAL_CALIFICACION_APROBATORIA,
  calcularPonderacion,
  type DesempenoData,
} from "@/lib/types/desempeno"
import DesempenoPrint from "./desempeno-print"
import { DesempenoForm } from "./desempeno-form-operativo"
import { DesempenoSaveSuccess } from "./desempeno-save-success"
import { DesempenoGuia, guiaYaVista } from "./desempeno-guia"
import { useRole } from "@/lib/hooks"
import { usePendingEvals } from "@/lib/hooks/usePendingEvals"
import { cn } from "@/lib/utils"

// ─── Sub-componente: botón de acción con ícono + label responsivo ─────────────

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  tooltip: string
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  asChild?: boolean
  href?: string
  className?: string
  /** Badge numérico encima del ícono */
  badge?: number
  /** Si true, anima la entrada del badge */
  animateBadge?: boolean
}

function ActionButton({
  icon,
  label,
  tooltip,
  onClick,
  disabled,
  variant = "outline",
  href,
  className = "",
  badge,
  animateBadge,
}: ActionButtonProps) {
  const inner = (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={disabled}
      className={[
        // Base
        "relative inline-flex items-center justify-center gap-1.5 rounded-md h-8 px-3 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50 disabled:grayscale-[0.3]",
        // Variant styles
        variant === "default"
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : variant === "ghost"
          ? "text-muted-foreground hover:bg-accent hover:text-foreground"
          : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm",
        className,
      ].join(" ")}
      aria-label={tooltip}
    >
      {badge !== undefined && badge > 0 && (
        animateBadge ? (
          <motion.span
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold tabular-nums text-destructive-foreground shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            {badge}
          </motion.span>
        ) : (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold tabular-nums text-destructive-foreground shadow-sm">
            {badge}
          </span>
        )
      )}

      {/* Ícono — siempre visible */}
      <span className="shrink-0">{icon}</span>

      {/* Label — solo en md+ */}
      <span className="hidden md:inline">{label}</span>
    </motion.button>
  )

  const wrapped = href ? <Link href={href}>{inner}</Link> : inner

  return (
    <Tooltip>
      <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

// ─── Aviso con severidad (color semántico por tema, responsivo) ───────────────

function NoticeCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: "danger" | "warning"
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  // Color semántico via tokens del tema (se adapta a claro/oscuro).
  const v = tone === "danger" ? "--destructive" : "--warning"
  return (
    <div
      role="alert"
      className="flex items-center gap-1.5 py-1"
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ color: `hsl(var(${v}))` }}
      >
        {icon}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-center min-w-0 gap-x-1.5 gap-y-0.5 text-sm">
        <span
          className="font-medium whitespace-nowrap"
          style={{ color: `hsl(var(${v}))` }}
        >
          {title}{title ? ":" : ""}
        </span>
        <span className="text-foreground/80">{children}</span>
      </div>
    </div>
  )
}

// ─── Botón "Guía" ─────────────────────────────────────────────────────────────

interface GuiaButtonProps {
  onClick: () => void
}

function GuiaButton({ onClick }: GuiaButtonProps) {
  return (
    <ActionButton
      icon={<Sparkles className="h-3.5 w-3.5" />}
      label="Guía"
      tooltip="Ver guía de evaluación"
      onClick={onClick}
      variant="default"
    />
  )
}

// ─── Separador visual entre grupos de acciones ────────────────────────────────

function ActionDivider() {
  return <div className="h-5 w-px bg-border" aria-hidden />
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

function DesempenoFormSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="pb-3 border-b">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

function DesempenoSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [numeroBuscado, setNumeroBuscado] = useState("")
  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(
    PERIODOS_DESEMPENO.semestrales[0]
  )
  const { data, setData, origen, requiereSemestral, semestreObjetivo, fechaIngreso, loading, saving, saveSuccess, resetSaveSuccess, error, buscarEmpleado, buscarSugerencias, guardar, recalcularAsistencia, cargarEvaluacion } =
    useDesempeno()
  const { isEvaluador, departamentosScope } = useRole()
  const { totalEvals, totalVencidas, totalProximas, totalATiempo } = usePendingEvals(departamentosScope)
  const [guiaOpen, setGuiaOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)

  // Typeahead + recientes
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<Array<{ numero: string; nombre: string; puesto: string }>>([])
  const [suggLoading, setSuggLoading] = useState(false)
  const [showSugg, setShowSugg] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [recientes, setRecientes] = useState<Array<{ numero: string; nombre: string }>>([])
  // Gate de impresión: solo se puede imprimir una evaluación ya guardada y sin ediciones posteriores.
  const savedSnapshotRef = useRef<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Cargar evaluación desde URL si existe evalId
  useEffect(() => {
    const evalId = searchParams.get('evalId')
    if (evalId && cargarEvaluacion) {
      // Legacy URL-driven flow: the editing flag must flip before the async
      // load resolves. Suppressed until this effect is refactored to a
      // render-derived state machine.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModoEdicion(true)
      cargarEvaluacion(evalId).then((result) => {
        if (result?.periodo) {
          // Determinar si es mensual o semestral según el periodo cargado
          const mensuales = PERIODOS_DESEMPENO.mensuales as readonly string[]
          const semestrales = PERIODOS_DESEMPENO.semestrales as readonly string[]
          
          if (mensuales.includes(result.periodo)) {
            setPeriodoModo("mensuales")
            setPeriodoSeleccionado(result.periodo as DesempenoPeriodo)
          } else if (semestrales.includes(result.periodo)) {
            setPeriodoModo("semestrales")
            setPeriodoSeleccionado(result.periodo as DesempenoPeriodo)
          }
        }
        // Limpiar URL después de cargar
        router.replace('/desempeno', { scroll: false })
      })
    }
  }, [searchParams, cargarEvaluacion, router])

  useEffect(() => {
    if (!isEvaluador) return
    if (!guiaYaVista()) setGuiaOpen(true)
  }, [isEvaluador])

  // Al cambiar de modo, conserva el periodo si sigue siendo válido para ese
  // modo; si no (p.ej. venías de semestral), cae al primero del modo nuevo.
  // No clobberea el periodo auto-seleccionado al cargar un empleado.
  useEffect(() => {
    setPeriodoSeleccionado((prev) =>
      (PERIODOS_DESEMPENO[periodoModo] as readonly string[]).includes(prev)
        ? prev
        : PERIODOS_DESEMPENO[periodoModo][0],
    )
  }, [periodoModo])

  // Carga búsquedas recientes desde localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("desempeno_recientes")
      if (raw) setRecientes(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // Recalcula la asistencia cuando cambia el periodo seleccionado
  useEffect(() => {
    if (data && recalcularAsistencia) {
      recalcularAsistencia(periodoSeleccionado)
    }
  }, [periodoSeleccionado, recalcularAsistencia])

  // Atajo "/" para enfocar el buscador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return
      const el = document.activeElement as HTMLElement | null
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Debounce de sugerencias (≥2 caracteres).
  useEffect(() => {
    const term = numeroBuscado.trim()
    if (term.length < 2) {
      setSuggestions([])
      setSuggLoading(false)
      return
    }
    setSuggLoading(true)
    const t = setTimeout(async () => {
      const res = await buscarSugerencias(term)
      setSuggestions(res)
      setActiveIdx(-1)
      setSuggLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [numeroBuscado, buscarSugerencias])

  const addReciente = useCallback((item: { numero: string; nombre: string }) => {
    setRecientes((prev) => {
      const next = [item, ...prev.filter((r) => r.numero !== item.numero)].slice(0, 5)
      try { localStorage.setItem("desempeno_recientes", JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const doBuscar = useCallback(async (valor: string, nombre?: string) => {
    const v = valor.trim()
    if (!v) return
    setShowSugg(false)
    setActiveIdx(-1)
    setModoEdicion(false) // Salir del modo edición al buscar nuevo empleado
    const res = await buscarEmpleado(v, departamentosScope, periodoSeleccionado)
    if (res) {
      // Auto-selecciona el modo/periodo correcto según el origen del empleado:
      // planta → Semestral, nuevo ingreso → Mensual (con auto-avance de semestre).
      setPeriodoModo(res.modo)
      setPeriodoSeleccionado(res.periodo as DesempenoPeriodo)
    }
    addReciente({ numero: v, nombre: nombre ?? "" })
  }, [buscarEmpleado, departamentosScope, periodoSeleccionado, addReciente])

  // Realizar búsqueda inicial si existe el parámetro 'q'
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setNumeroBuscado(q)
      doBuscar(q)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('q')
      router.replace(`/desempeno?${newParams.toString()}`, { scroll: false })
    }
  }, [searchParams, router, doBuscar])

  const handleSearch = () => doBuscar(numeroBuscado)

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setShowSugg(true)
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      const s = showSugg && activeIdx >= 0 ? suggestions[activeIdx] : undefined
      if (s) {
        setNumeroBuscado(s.numero)
        doBuscar(s.numero, s.nombre)
      } else {
        doBuscar(numeroBuscado)
      }
    } else if (e.key === "Escape") {
      setShowSugg(false)
      setActiveIdx(-1)
    }
  }

  // Se "ensucia" al editar o cargar otro empleado → deshabilita imprimir.
  useEffect(() => {
    if (!data) {
      savedSnapshotRef.current = null
      setGuardado(false)
      return
    }
    setGuardado(savedSnapshotRef.current === JSON.stringify(data))
  }, [data])

  // Tras guardar con éxito, fija el snapshot como "limpio".
  useEffect(() => {
    if (saveSuccess && data) {
      savedSnapshotRef.current = JSON.stringify(data)
      setGuardado(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveSuccess])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const ponderacion = data ? calcularPonderacion(data) : null
  const requiereCompromisos = ponderacion !== null && ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA
  const tieneCompromisos = !!(data?.compromisos?.trim())
  const bloqueado = requiereCompromisos && !tieneCompromisos
  const faltaEvaluador = data ? !data.evaluador_nombre : false

  // Elegibilidad por antigüedad para evaluaciones semestrales.
  // Empleados con < 2 meses respecto al fin del periodo no son evaluables.
  const periodoEvaluacion = data?.periodo || periodoSeleccionado
  const elegibilidad = data
    ? esElegibleParaPeriodo(fechaIngreso, periodoEvaluacion)
    : { elegible: true, motivo: "", cutoff: null, reglaAplica: false }
  const noElegible = elegibilidad.reglaAplica && !elegibilidad.elegible

  // Guardrail de periodo según origen del empleado:
  //  - planta YA elegible para el semestre activo en modo Mensual → ERROR
  //    (bloquea guardar/imprimir). Planta recién ingresado (no elegible) NO se
  //    bloquea: se evalúa mensual como onboarding hasta cumplir antigüedad.
  //  - nuevo ingreso en modo Semestral → aviso suave (no bloquea).
  const mismatchBloqueo = requiereSemestral && periodoModo === "mensuales"
  const mismatchSuave = origen === "nuevo_ingreso" && periodoModo === "semestrales"
  const periodoSemestralObjetivo = semestreObjetivo ?? PERIODOS_DESEMPENO.semestrales[0]

  const previewData: DesempenoData = {
    ...(data ?? {
      numero_empleado: "",
      nombre: "",
      puesto: "",
      evaluador_nombre: "",
      evaluador_puesto: "",
      tipo: "operativo",
      objetivos: DEFAULT_OBJETIVOS_POR_TIPO["operativo"],
      cumplimiento_responsabilidades: (DEFAULT_CUMPLIMIENTO_POR_TIPO["operativo"] ?? DEFAULT_CUMPLIMIENTO).map((c) => ({ ...c })),
      competencias: (DEFAULT_COMPETENCIAS_POR_TIPO["operativo"] ?? DEFAULT_COMPETENCIAS_POR_TIPO.operativo).map((c) => ({ ...c })),
      compromisos: "",
      fecha_revision: "",
      observaciones: "",
      calificacion_final: 0,
      incidencias: [],
    }),
    periodo: data?.periodo || periodoSeleccionado,
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Buscador ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Buscar empleado</CardTitle>
                {modoEdicion && data && (
                  <Badge variant="default" className="text-xs">
                    Editando
                  </Badge>
                )}
              </div>

              {/* ── Barra de acciones ────────────────────────────────────── */}
              <div className="flex items-center gap-1">

                {/* Acciones globales (solo visibles si no hay evaluación activa) */}
                {!data && (
                  <>
                    <GuiaButton onClick={() => setGuiaOpen(true)} />

                    <ActionDivider />

                    {!isEvaluador && (
                      <ActionButton
                        icon={<FolderOpen className="h-3.5 w-3.5" />}
                        label="Guardadas"
                        tooltip="Evaluaciones guardadas"
                        href="/desempeno/objetivos"
                      />
                    )}

                    <ActionButton
                      icon={<ClipboardList className="h-3.5 w-3.5" />}
                      label="Pendientes"
                      tooltip={
                        totalEvals > 0
                          ? `${totalEvals} evaluación${totalEvals !== 1 ? "es" : ""} pendiente${totalEvals !== 1 ? "s" : ""}`
                          : "Sin evaluaciones pendientes"
                      }
                      href="/desempeno/pendientes"
                      badge={totalEvals}
                      animateBadge
                    />
                  </>
                )}

                {/* Grupo 3: Acciones sobre la evaluación activa */}
                {data && (
                  <>
                    <ActionButton
                      icon={<X className="h-3.5 w-3.5" />}
                      label="Cerrar"
                      tooltip="Descartar y volver al buscador"
                      onClick={() => {
                        setData(null)
                        setNumeroBuscado("")
                        const newParams = new URLSearchParams(searchParams.toString())
                        newParams.delete('q')
                        router.replace(`/desempeno?${newParams.toString()}`, { scroll: false })
                      }}
                      variant="outline"
                      className="text-foreground"
                    />

                    <ActionButton
                      icon={
                        saving
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Save className="h-3.5 w-3.5" />
                      }
                      label="Guardar"
                      tooltip={
                        faltaEvaluador
                          ? "Selecciona un evaluador primero"
                          : mismatchBloqueo
                          ? "Empleado de planta: evalúalo en modo Semestral, no Mensual"
                          : noElegible
                          ? "Empleado no elegible para este periodo semestral (< 2 meses)"
                          : bloqueado
                          ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)`
                          : "Guardar evaluación"
                      }
                      onClick={() => guardar({ ...data, periodo: data.periodo || periodoSeleccionado })}
                      disabled={saving || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador}
                      variant="outline"
                    />

                    <ActionButton
                      icon={<Printer className="h-3.5 w-3.5" />}
                      label="Imprimir"
                      tooltip={
                        faltaEvaluador
                          ? "Selecciona un evaluador primero"
                          : mismatchBloqueo
                          ? "Empleado de planta: evalúalo en modo Semestral, no Mensual"
                          : noElegible
                          ? "Empleado no elegible para este periodo semestral (< 2 meses)"
                          : bloqueado
                          ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)`
                          : !guardado
                          ? "Guarda la evaluación primero para poder imprimir"
                          : "Imprimir evaluación"
                      }
                      onClick={() => window.print()}
                      disabled={!guardado || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador}
                      variant="default"
                    />
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4 pt-3">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
              {/* Campo de búsqueda */}
              <div className="flex gap-2 flex-1 w-full min-w-[250px]">
                <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  value={numeroBuscado}
                  onChange={(e) => { setNumeroBuscado(e.target.value); setShowSugg(true) }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 120)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Buscar por número o nombre… ( / )"
                  className="pl-9 pr-9"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSugg}
                  aria-autocomplete="list"
                />
                {numeroBuscado && (
                  <button
                    type="button"
                    onClick={() => { setNumeroBuscado(""); setSuggestions([]); inputRef.current?.focus() }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Dropdown de sugerencias */}
                {showSugg && numeroBuscado.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
                    {suggLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias</div>
                    ) : (
                      suggestions.map((s, idx) => (
                        <button
                          key={s.numero}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setNumeroBuscado(s.numero); doBuscar(s.numero, s.nombre) }}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${idx === activeIdx ? "bg-accent" : "hover:bg-accent"}`}
                        >
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{s.numero}</span>
                          <span className="font-medium truncate">{s.nombre || "—"}</span>
                          {s.puesto && <span className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">{s.puesto}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSearch} aria-label="Buscar empleado" disabled={!numeroBuscado.trim()} className="shrink-0 px-4">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Buscar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Buscar empleado</TooltipContent>
              </Tooltip>
            </div>

              {/* Controles de Periodo y Buscar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full xl:w-auto shrink-0">
                <div className="flex bg-muted/60 p-1 rounded-lg shrink-0 w-full sm:w-auto">
                  {(["semestrales", "mensuales"] as const).map((modo) => (
                    <button
                      key={modo}
                      type="button"
                      onClick={() => setPeriodoModo(modo)}
                      className={`flex-1 sm:flex-none h-8 px-4 flex items-center justify-center text-sm font-medium rounded-md transition-all ${
                        periodoModo === modo
                          ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      }`}
                    >
                      {modo === "semestrales" ? "Semestral" : "Mensual"}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-[170px] shrink-0">
                  <Select
                    value={periodoSeleccionado}
                    onValueChange={(value) => setPeriodoSeleccionado(value as DesempenoPeriodo)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS_DESEMPENO[periodoModo].map((periodo) => (
                        <SelectItem key={periodo} value={periodo}>
                          {periodo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </div>

            {/* Búsquedas recientes */}
            {!numeroBuscado && recientes.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Recientes:
                </span>
                {recientes.map((r) => (
                  <button
                    key={r.numero}
                    type="button"
                    onClick={() => { setNumeroBuscado(r.numero); doBuscar(r.numero, r.nombre) }}
                    className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    title={`${r.numero}${r.nombre ? " · " + r.nombre : ""}`}
                  >
                    {r.nombre || r.numero}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banner de Pendientes en estado vacío */}
        {!data && totalEvals > 0 && (
          <div className="w-full">
            {(() => {
              const hasVencidas = totalVencidas > 0
              const hasProximas = totalProximas > 0
              
              let bgClass = "bg-card border-success"
              let iconBgClass = "bg-success text-success-foreground"
              let titleText = "Evaluaciones al día"
              let descText = `Tienes ${totalEvals} ${totalEvals === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'} con tiempo suficiente.`

              if (hasVencidas) {
                bgClass = "bg-card border-destructive"
                iconBgClass = "bg-destructive text-destructive-foreground"
                titleText = `${totalVencidas} ${totalVencidas === 1 ? 'evaluación atrasada' : 'evaluaciones atrasadas'}`
                descText = "Ya pasaron su fecha límite. Atiéndelas primero para regularizar el seguimiento."
              } else if (hasProximas) {
                bgClass = "bg-card border-warning"
                iconBgClass = "bg-warning text-warning-foreground"
                titleText = `${totalProximas} ${totalProximas === 1 ? 'evaluación vence' : 'evaluaciones vencen'} pronto`
                descText = "Revisa tu lista para asegurar su evaluación oportuna esta semana."
              }

              return (
                <div
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl border p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300",
                    bgClass
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
                    <div className={cn("rounded-lg p-3 shrink-0 hidden sm:flex", iconBgClass)}>
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div className="space-y-4 w-full flex-1">
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-foreground leading-none flex items-center gap-2">
                           <span className="sm:hidden" aria-hidden="true">
                              {hasVencidas ? "🔴" : hasProximas ? "🟠" : "🟢"}
                           </span>
                           {titleText}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-snug">
                          {descText}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                        {/* Vencidas */}
                        <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                          <span className="text-2xl font-bold leading-none text-destructive">{totalVencidas}</span>
                          <span className="text-xs text-muted-foreground mt-1 font-medium">Vencidas</span>
                        </div>
                        
                        {/* Próximas */}
                        <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                          <span className="text-2xl font-bold leading-none text-warning">{totalProximas}</span>
                          <span className="text-xs text-muted-foreground mt-1 font-medium truncate" title="Próximas (7d)">Próximas</span>
                        </div>
                        
                        {/* A tiempo */}
                        <div className="flex flex-col bg-background border rounded-lg p-3 relative overflow-hidden shadow-sm">
                          <span className="text-2xl font-bold leading-none text-success">{totalATiempo}</span>
                          <span className="text-xs text-muted-foreground mt-1 font-medium">A tiempo</span>
                        </div>
                      </div>

                    </div>
                  </div>
                  <Button asChild size="lg" className="w-full sm:w-auto shrink-0 shadow-sm whitespace-nowrap self-stretch sm:self-center mt-2 sm:mt-0">
                    <Link href="/desempeno/pendientes">
                      Revisar pendientes
                    </Link>
                  </Button>
                </div>
              )
            })()}
          </div>
        )}

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {noElegible && (
          <NoticeCard
            tone="warning"
            icon={<CalendarX2 className="h-5 w-5" />}
            title="Empleado no elegible para evaluación semestral"
          >
            {elegibilidad.motivo} Cambia el periodo o espera al siguiente semestre.
          </NoticeCard>
        )}

        {mismatchBloqueo && (
          <NoticeCard
            tone="danger"
            icon={<CalendarX2 className="h-5 w-5" />}
            title="Periodo equivocado: este empleado es de planta"
          >
            El personal de planta se evalúa <strong className="font-semibold text-foreground">SEMESTRAL</strong> ({periodoSemestralObjetivo}), no mensual. Cambia el modo a <strong className="font-semibold text-foreground">Semestral</strong> para poder guardar.
          </NoticeCard>
        )}

        {mismatchSuave && (
          <NoticeCard
            tone="warning"
            icon={<AlertCircle className="h-5 w-5" />}
            title="¿Seguro? Este empleado es de nuevo ingreso"
          >
            Los nuevos ingresos normalmente se evalúan en modo <strong className="font-semibold text-foreground">Mensual</strong> (onboarding). Verifica el periodo antes de guardar.
          </NoticeCard>
        )}

        {loading ? (
          <DesempenoFormSkeleton />
        ) : data ? (
          <DesempenoForm 
            data={data} 
            onUpdate={setData} 
            onGuardar={() => guardar({ ...data, periodo: data.periodo || periodoSeleccionado })}
            guardarDisabled={saving || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador}
            guardarTooltip={
              faltaEvaluador
                ? "Selecciona un evaluador primero"
                : mismatchBloqueo
                ? "Empleado de planta: evalúalo en modo Semestral, no Mensual"
                : noElegible
                ? "Empleado no elegible para este periodo semestral (< 2 meses)"
                : bloqueado
                ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)`
                : "Guardar evaluación"
            }
          />
        ) : null}

        {data && (
          <div className="print-area hidden print:block">
            <DesempenoPrint data={data} />
          </div>
        )}

        <DesempenoSaveSuccess
          visible={saveSuccess}
          nombre={data?.nombre}
          calificacion={ponderacion?.calificacionFinal}
          onDone={resetSaveSuccess}
        />

        <DesempenoGuia open={guiaOpen} onClose={() => setGuiaOpen(false)} />
      </div>
    </TooltipProvider>
  )
}


// ─── Export con Suspense boundary ─────────────────────────────────────────────

export default function DesempenoSearch() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    }>
      <DesempenoSearchContent />
    </Suspense>
  )
}
