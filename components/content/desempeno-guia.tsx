"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  Loader2,
  Lock,
  Printer,
  Save,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePhaseLoop } from "@/lib/hooks/usePhaseLoop"

// ─── Persistencia ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "desempeno-guia-vista"

export function guiaYaVista(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY) } catch { return false }
}

function marcarGuiaVista(): void {
  try { localStorage.setItem(STORAGE_KEY, "1") } catch { /* SSR / modo privado */ }
}

// ─── Configuración de fases (nivel de módulo = referencias estables) ──────────

const P1_PHASES  = ["searching", "found"]                                          as const
const P1_DUR     = [2000, 2800]                                                    as const

const P2_PHASES  = ["semestral", "open_s", "mensual", "open_m"]                    as const
const P2_DUR     = [1600, 2000, 1600, 2000]                                        as const

const P3_PHASES  = ["empty", "filling", "done", "reset"]                           as const
const P3_DUR     = [400, 2800, 2400, 350]                                          as const

const P4_PHASES  = ["blocked", "typing", "unlocked", "loading", "success", "pause"] as const
const P4_DUR     = [1400, 2000, 800, 1300, 2400, 500]                              as const

const P5_PHASES  = ["idle", "printing", "sliding", "delivering", "done"]           as const
const P5_DUR     = [700, 1200, 1000, 1100, 1600]                                   as const

// Índice estático por ilustración cuando reduce-motion está activo
const STATIC_P1 = 1 // found
const STATIC_P2 = 1 // open_s
const STATIC_P3 = 2 // done
const STATIC_P4 = 4 // success
const STATIC_P5 = 4 // done

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface IllusProps {
  active: boolean
}

interface Step {
  num: string
  title: string
  description: string
  Illus: (p: IllusProps) => React.ReactElement
}

// ─── Ilustración 1 — Buscar empleado ─────────────────────────────────────────

function Illus1({ active }: IllusProps) {
  const reduce = useReducedMotion()
  const phase  = usePhaseLoop(P1_PHASES, P1_DUR, {
    paused: !active,
    staticIndex: reduce ? STATIC_P1 : undefined,
  })
  const searching = phase === "searching"

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* Mini action bar */}
      <div className="flex w-full max-w-[260px] items-center justify-between rounded-lg border bg-card px-2.5 py-1.5 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones
        </span>
        <div className="flex items-center gap-1">
          <div className="flex h-6 items-center gap-1 rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            <span>Guía</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="relative flex h-6 items-center gap-1 rounded-md border bg-background px-1.5 text-[10px] font-medium text-foreground">
            <ClipboardList className="h-2.5 w-2.5" />
            <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground">
              3
            </span>
          </div>
        </div>
      </div>

      {/* Campo de búsqueda */}
      <motion.div
        className={cn(
          "flex h-10 w-full max-w-[260px] items-center gap-2.5 rounded-xl border-2 bg-background px-3 transition-colors duration-500",
          searching
            ? "border-primary/60 shadow-[0_0_14px_hsl(var(--primary)/0.2)]"
            : "border-border",
        )}
      >
        <motion.div
          animate={searching ? { rotate: [0, -14, 14, 0] } : { rotate: 0 }}
          transition={{ duration: 0.7, repeat: searching ? Infinity : 0, repeatDelay: 0.9 }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        </motion.div>
        <span className="font-mono text-sm text-foreground">3204</span>
        {searching && (
          <motion.span
            className="h-4 w-px bg-primary"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </motion.div>

      {/* Tarjeta de resultado */}
      <div className="flex h-[58px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "found" && (
            <motion.div
              key="card"
              className="flex w-full max-w-[260px] items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-md"
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <motion.div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <User className="h-4 w-4 text-primary" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  Hernandez Leonardo
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Administrativo &middot; RRHH
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.18 }}
                className="shrink-0"
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Ilustración 2 — Seleccionar periodo ─────────────────────────────────────

function Illus2({ active }: IllusProps) {
  const reduce = useReducedMotion()
  const phase  = usePhaseLoop(P2_PHASES, P2_DUR, {
    paused: !active,
    staticIndex: reduce ? STATIC_P2 : undefined,
  })
  const isSemestral = phase === "semestral" || phase === "open_s"
  const dropOpen    = phase === "open_s" || phase === "open_m"
  const options     = isSemestral
    ? ["DIC-MAY 2026", "JUN-NOV 2026"]
    : ["MAYO 2026", "JUNIO 2026"]

  return (
    <div className="flex w-full max-w-[260px] flex-col items-center gap-3">
      {/* Toggle Semestral / Mensual */}
      <div className="grid w-full grid-cols-2 gap-2">
        {[
          { id: "semestral", label: "Semestral", on: isSemestral },
          { id: "mensual",   label: "Mensual",   on: !isSemestral },
        ].map((btn) => (
          <div
            key={btn.id}
            className={cn(
              "rounded-md py-2 text-center text-sm font-medium transition-all duration-300",
              btn.on
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "border border-input bg-background text-foreground",
            )}
          >
            {btn.label}
          </div>
        ))}
      </div>

      {/* Select de periodo */}
      <div className="w-full overflow-hidden rounded-md border bg-background shadow-sm">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm text-foreground">
            {isSemestral ? "DIC-MAY 2026" : "MAYO 2026"}
          </span>
          <motion.div
            animate={{ rotate: dropOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {dropOpen && (
            <motion.div
              key="opts"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t"
            >
              {options.map((opt, i) => (
                <div
                  key={opt}
                  className={cn(
                    "px-3 py-2 text-sm",
                    i === 0
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {opt}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Ilustración 3 — Completar evaluación ────────────────────────────────────

const BARS = [
  { label: "Objetivos",         weight: 40, pct: 85, delay: 0    },
  { label: "Responsabilidades", weight: 30, pct: 92, delay: 0.18 },
  { label: "Competencias",      weight: 30, pct: 78, delay: 0.36 },
] as const

function Illus3({ active }: IllusProps) {
  const reduce = useReducedMotion()
  const phase  = usePhaseLoop(P3_PHASES, P3_DUR, {
    paused: !active,
    staticIndex: reduce ? STATIC_P3 : undefined,
  })
  const filled = phase === "filling" || phase === "done"

  return (
    <div className="flex w-full max-w-[260px] flex-col gap-2.5">
      {BARS.map((bar) => (
        <div key={bar.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-xs text-foreground">{bar.label}</span>
              <span className="text-[10px] text-muted-foreground">{bar.weight}%</span>
            </div>
            <motion.span
              className="text-xs font-semibold tabular-nums text-foreground"
              animate={{ opacity: filled ? 1 : 0 }}
              transition={{ duration: 0.3, delay: filled ? bar.delay + 0.9 : 0 }}
            >
              {bar.pct}%
            </motion.span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: filled ? `${bar.pct}%` : "0%" }}
              transition={{
                duration: filled ? 1.1 : 0.25,
                delay: filled ? bar.delay : 0,
                ease: "easeOut",
              }}
            />
          </div>
        </div>
      ))}

      <div className="mt-1 flex justify-center">
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              key="score"
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary/80">
                Final
              </span>
              <span className="text-lg font-bold tabular-nums text-primary">85%</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Ilustración 4 — Guardar (flujo de compromisos < 80%) ────────────────────

function Illus4({ active }: IllusProps) {
  const reduce = useReducedMotion()
  const phase  = usePhaseLoop(P4_PHASES, P4_DUR, {
    paused: !active,
    staticIndex: reduce ? STATIC_P4 : undefined,
  })

  const showAlert    = phase === "blocked" || phase === "typing"
  const showTextarea = phase === "typing"  || phase === "unlocked"

  const buttonState: "blocked" | "ready" | "loading" | "success" =
    phase === "loading"  ? "loading"  :
    phase === "success"  ? "success"  :
    phase === "blocked" || phase === "typing" ? "blocked" :
    "ready"

  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-2.5">
      {/* Alerta < 80% */}
      <AnimatePresence initial={false}>
        {showAlert && (
          <motion.div
            key="alert"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
              <Lock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Calificación &lt; {UMBRAL_CALIFICACION_APROBATORIA}% &mdash; captura compromisos
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea de compromisos */}
      <AnimatePresence initial={false}>
        {showTextarea && (
          <motion.div
            key="textarea"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full overflow-hidden"
          >
            <div className="rounded-md border bg-background px-3 py-2">
              <p className="text-[11px] leading-relaxed text-foreground">
                Capacitación módulo X &middot; seguimiento mensual
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón Guardar */}
      <motion.div
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-300",
          buttonState === "blocked"
            ? "border border-input bg-muted text-muted-foreground"
            : buttonState === "success"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "bg-primary text-primary-foreground shadow-sm",
        )}
      >
        {buttonState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonState === "success" && (
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.span>
        )}
        {(buttonState === "blocked" || buttonState === "ready") && (
          <Save className="h-4 w-4" />
        )}
        <span>
          {buttonState === "loading" ? "Guardando"
            : buttonState === "success" ? "Guardado"
            : "Guardar"}
        </span>
      </motion.div>
    </div>
  )
}

// ─── Ilustración 5 — Imprimir y entregar ─────────────────────────────────────

function Illus5({ active }: IllusProps) {
  const reduce = useReducedMotion()
  const phase  = usePhaseLoop(P5_PHASES, P5_DUR, {
    paused: !active,
    staticIndex: reduce ? STATIC_P5 : undefined,
  })
  const arrowActive    = phase === "sliding" || phase === "delivering" || phase === "done"
  const buildingActive = phase === "delivering" || phase === "done"

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {/* Impresora */}
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{ scale: phase === "printing" ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            <Printer className="h-12 w-12 text-primary" />
          </motion.div>

          <AnimatePresence>
            {(phase === "printing" || phase === "sliding") && (
              <motion.div
                key="paper"
                className="absolute -bottom-8 flex w-11 flex-col gap-[2px] rounded-sm border bg-card px-1.5 py-1.5 shadow-sm"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 2, opacity: 1 }}
                exit={{ x: 60, opacity: 0, transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.4 }}
              >
                {[1, 0.85, 1, 0.55, 0.7].map((w, i) => (
                  <div
                    key={i}
                    className="h-px rounded-full bg-muted-foreground/30"
                    style={{ width: `${w * 100}%` }}
                  />
                ))}
                <div className="mt-1 h-px w-3/4 self-center bg-primary/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Flecha */}
        <motion.div
          animate={{
            x: arrowActive ? [0, 5, 0] : 0,
            opacity: arrowActive ? 1 : 0.25,
          }}
          transition={{ duration: 0.7, repeat: arrowActive ? Infinity : 0, ease: "easeInOut" }}
        >
          <ArrowRight className="h-6 w-6 text-primary/70" />
        </motion.div>

        {/* Edificio */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            animate={{
              scale: phase === "done" ? [1, 1.12, 1] : 1,
              opacity: buildingActive ? 1 : 0.4,
            }}
            transition={{ duration: 0.4 }}
          >
            <Building2
              className={cn(
                "h-12 w-12 transition-colors duration-500",
                buildingActive ? "text-primary" : "text-muted-foreground/40",
              )}
            />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground">
            Capacitación
          </span>
        </div>
      </div>

      {/* Badge entregado */}
      <div className="flex h-8 items-center">
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              key="done"
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              <Check className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">Entregado</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Configuración de pasos ───────────────────────────────────────────────────

const STEPS: readonly Step[] = [
  {
    num: "01",
    title: "Busca al empleado",
    description:
      "Ingresa el número de empleado en el campo de búsqueda y presiona Enter. El sistema cargará la información registrada.",
    Illus: Illus1,
  },
  {
    num: "02",
    title: "Selecciona el periodo",
    description:
      "Elige si la evaluación es semestral o mensual y selecciona el periodo exacto en el desplegable. Asegúrate de elegir el correcto antes de empezar.",
    Illus: Illus2,
  },
  {
    num: "03",
    title: "Completa la evaluación",
    description:
      "Revisa y ajusta los objetivos, el cumplimiento de responsabilidades y las competencias. Cada sección tiene un peso distinto en la calificación final.",
    Illus: Illus3,
  },
  {
    num: "04",
    title: "Guarda la evaluación",
    description:
      `Presiona el botón Guardar. Si la calificación final es menor a ${UMBRAL_CALIFICACION_APROBATORIA}%, deberás capturar los compromisos de mejora antes de poder guardar e imprimir.`,
    Illus: Illus4,
  },
  {
    num: "05",
    title: "Imprime y entrega",
    description:
      "Usa el botón de impresión para generar el formato oficial. Imprímelo, recolecta firmas y entrégalo físicamente al departamento de Capacitación.",
    Illus: Illus5,
  },
] as const

// ─── Variantes de animación de slides ────────────────────────────────────────

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ?  72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -72 :  72, opacity: 0 }),
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesempenoGuiaProps {
  open: boolean
  onClose: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DesempenoGuia({ open, onClose }: DesempenoGuiaProps) {
  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState(1)
  const [mounted, setMounted] = useState(false)
  const cardRef             = useRef<HTMLDivElement>(null)
  const previousFocusRef    = useRef<HTMLElement | null>(null)

  // Guard SSR: createPortal requiere document.body
  useEffect(() => { setMounted(true) }, [])

  // Separar setDir y setStep para evitar side-effects dentro de updaters
  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next))
    setStep((current) => {
      if (clamped === current) return current
      setDir(clamped > current ? 1 : -1)
      return clamped
    })
  }, [])

  const handleClose = useCallback(() => {
    marcarGuiaVista()
    onClose()
    // El reset ocurre en onExitComplete para no interrumpir la animación de salida
  }, [onClose])

  // El header tiene backdrop-filter propio (z-20) que crea un stacking context
  // y "escapa" visualmente del blur del modal aunque este tenga z-index mayor.
  // Solución: agregar clase al <html> cuando la guía está abierta para
  // desactivar el backdrop-filter del header vía CSS global.
  useEffect(() => {
    const root = document.documentElement
    if (open) root.classList.add("guia-open")
    else root.classList.remove("guia-open")
    return () => root.classList.remove("guia-open")
  }, [open])

  const handleExitComplete = useCallback(() => {
    setStep(0)
    setDir(1)
  }, [])

  // Atajos de teclado: ESC + flechas
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goTo(step - 1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goTo(step + 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, step, goTo, handleClose])

  // Foco: enfocar card al abrir, restaurar al cerrar
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      // Espera a que la animación de entrada termine antes de enfocar
      const t = setTimeout(() => cardRef.current?.focus(), 220)
      return () => clearTimeout(t)
    }
    previousFocusRef.current?.focus?.()
  }, [open])

  // Swipe horizontal para navegar — tipado correcto del primer parámetro
  const onDragEnd = useCallback(
    (_e: PointerEvent, info: PanInfo) => {
      const THRESHOLD = 60
      if (info.offset.x < -THRESHOLD) goTo(step + 1)
      else if (info.offset.x > THRESHOLD) goTo(step - 1)
    },
    [step, goTo],
  )

  const isLast  = step === STEPS.length - 1
  const current = STEPS[step]
  const { Illus } = current

  if (!mounted) return null

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {open && (
          // ── Backdrop ────────────────────────────────────────────────────────
          <motion.div
            key="guia-backdrop"
            data-guia-backdrop=""
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onPointerDown={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guia-title-container"
          >
            {/* ── Card ──────────────────────────────────────────────────────── */}
            <motion.div
              ref={cardRef}
              tabIndex={-1}
              className={cn(
                "relative w-full max-w-md overflow-hidden border bg-card shadow-2xl outline-none",
                "rounded-t-3xl sm:rounded-3xl",
                "ring-1 ring-primary/10",
                "pb-[env(safe-area-inset-bottom)]",
              )}
              initial={{ scale: 0.92, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              // onPointerDown para consistencia con el backdrop
              onPointerDown={(e) => e.stopPropagation()}
              // Swipe en toda la card excepto botones de navegación
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
            >
              {/* Drag handle — solo móvil */}
              <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Barras de progreso clickeables */}
              <div className="flex gap-1.5 px-5 pt-4">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ir al paso ${i + 1}`}
                    aria-current={i === step ? "step" : undefined}
                    className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      animate={{ width: i <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </button>
                ))}
              </div>

              {/* Header: etiqueta de paso + Saltar + cerrar */}
              <div className="flex items-center justify-between gap-2 px-5 pb-1 pt-3">
                <motion.span
                  key={step}
                  className="text-xs font-bold tabular-nums text-muted-foreground"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  PASO {current.num} DE {STEPS.length.toString().padStart(2, "0")}
                </motion.span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Saltar guía
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Cerrar guía"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Zona de ilustración */}
              <div className="relative flex h-52 cursor-grab items-center justify-center overflow-hidden px-6 active:cursor-grabbing">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex w-full items-center justify-center"
                  >
                    <Illus active={open} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Texto — contenedor estático con id para aria-labelledby */}
              <div
                id="guia-title-container"
                className="min-h-[5.5rem] px-6 pb-2"
                aria-live="polite"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${step}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h3 className="text-base font-bold text-foreground">
                      {current.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {current.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navegación */}
              <div className="flex items-center justify-between gap-2 px-5 py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goTo(step - 1)}
                  disabled={step === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <Button
                  size="sm"
                  onClick={isLast ? handleClose : () => goTo(step + 1)}
                  className="gap-1"
                >
                  {isLast ? (
                    <>
                      <Check className="h-4 w-4" />
                      Entendido
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  )
}
