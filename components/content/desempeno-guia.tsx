"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
  Save,
  Search,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── localStorage key ─────────────────────────────────────────────────────────
const STORAGE_KEY = "desempeno-guia-vista"

// ─── Phase loop hook ──────────────────────────────────────────────────────────
// Cycles through `phases` spending `durations[i]` ms on each index.
// Uses refs so the arrays can be defined at module level without stale closures.
function usePhaseLoop<T extends string>(
  phases: readonly T[],
  durations: readonly number[],
): T {
  const [idx, setIdx] = useState(0)
  const ref = useRef({ phases, durations })

  useEffect(() => {
    const { durations: d, phases: p } = ref.current
    const t = setTimeout(() => setIdx((i) => (i + 1) % p.length), d[idx])
    return () => clearTimeout(t)
  }, [idx])

  return phases[idx]
}

// ─── Phase configs (module-level = stable references) ─────────────────────────
const P1_PHASES   = ["searching", "found"]                               as const
const P1_DUR      = [2000, 2800]                                         as const
const P2_PHASES   = ["semestral", "open_s", "mensual", "open_m"]         as const
const P2_DUR      = [1600, 1800, 1600, 1800]                             as const
const P3_PHASES   = ["empty", "filling", "done", "reset"]                as const
const P3_DUR      = [400, 2800, 2200, 350]                               as const
const P4_PHASES   = ["idle", "pressing", "loading", "success", "pause"]  as const
const P4_DUR      = [1400, 200, 1300, 2600, 400]                         as const
const P5_PHASES   = ["idle", "printing", "sliding", "delivering", "done"] as const
const P5_DUR      = [700, 1200, 1000, 1100, 1400]                        as const

// ─── Illustration 1 — Buscar empleado ─────────────────────────────────────────
function Illus1() {
  const phase = usePhaseLoop(P1_PHASES, P1_DUR)
  const searching = phase === "searching"

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Search bar */}
      <motion.div
        className={cn(
          "flex h-11 w-64 items-center gap-3 rounded-xl border-2 bg-muted/50 px-4 transition-all duration-500",
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

      {/* Result card */}
      <div className="h-[60px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "found" && (
            <motion.div
              key="card"
              className="flex w-64 items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-md"
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
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">Hernandez Leonardo</p>
                <p className="text-xs text-muted-foreground">Administrativo · Recursos Humanos</p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.18 }}
                className="ml-auto shrink-0"
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

// ─── Illustration 2 — Seleccionar periodo ─────────────────────────────────────
function Illus2() {
  const phase = usePhaseLoop(P2_PHASES, P2_DUR)
  const isSemestral = phase === "semestral" || phase === "open_s"
  const dropOpen    = phase === "open_s" || phase === "open_m"

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        {[
          { id: "semestral", label: "Semestral", active: isSemestral },
          { id: "mensual",   label: "Mensual",   active: !isSemestral },
        ].map((btn) => (
          <div
            key={btn.id}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-500",
              btn.active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.04]"
                : "bg-muted text-muted-foreground scale-100",
            )}
          >
            {btn.label}
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <motion.div className="w-60 overflow-hidden rounded-xl border bg-card shadow-md">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-foreground">
            {isSemestral ? "ENE-JUN 2026" : "MAYO 2026"}
          </span>
          <motion.div
            animate={{ rotate: dropOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {dropOpen && (
            <motion.div
              key="opts"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="border-t overflow-hidden"
            >
              {(isSemestral
                ? ["ENE-JUN 2026", "JUL-DEC 2026"]
                : ["MAYO 2026", "JUNIO 2026"]
              ).map((opt, i) => (
                <div
                  key={opt}
                  className={cn(
                    "px-4 py-2 text-sm",
                    i === 0
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {opt}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── Illustration 3 — Completar evaluación ────────────────────────────────────
const BARS = [
  { label: "Objetivos",          pct: 85, delay: 0 },
  { label: "Responsabilidades",  pct: 92, delay: 0.18 },
  { label: "Competencias",       pct: 78, delay: 0.36 },
] as const

function Illus3() {
  const phase = usePhaseLoop(P3_PHASES, P3_DUR)
  const filled = phase === "filling" || phase === "done"

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {BARS.map((bar) => (
        <div key={bar.label} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{bar.label}</span>
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

      {/* Final score */}
      <div className="mt-1 flex justify-center">
        <AnimatePresence>
          {phase === "done" && (
            <motion.span
              key="score"
              className="rounded-full border border-primary/30 bg-primary/10 px-5 py-1.5 text-xl font-bold text-primary"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              85%
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Illustration 4 — Guardar ─────────────────────────────────────────────────
function Illus4() {
  const phase = usePhaseLoop(P4_PHASES, P4_DUR)

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Save button */}
      <motion.div
        className={cn(
          "flex h-10 cursor-default items-center gap-2.5 rounded-xl px-6 text-sm font-semibold transition-colors duration-300",
          phase === "success"
            ? "border border-primary/30 bg-primary/10 text-primary"
            : "bg-primary text-primary-foreground",
        )}
        animate={{ scale: phase === "pressing" ? 0.9 : 1 }}
        transition={{ duration: 0.12 }}
      >
        {phase === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {phase === "success" && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.div>
        )}
        {(phase === "idle" || phase === "pressing" || phase === "pause") && (
          <Save className="h-4 w-4" />
        )}
        <span>
          {phase === "loading"
            ? "Guardando…"
            : phase === "success"
              ? "¡Guardado!"
              : "Guardar"}
        </span>
      </motion.div>

      {/* Info text */}
      <div className="h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "success" && (
            <motion.p
              key="ok"
              className="text-center text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              Los datos quedan registrados en el sistema.
            </motion.p>
          )}
          {phase === "idle" && (
            <motion.p
              key="hint"
              className="text-center text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              Si la calificación es &lt; 80 % primero captura compromisos.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Illustration 5 — Imprimir y entregar ─────────────────────────────────────
function Illus5() {
  const phase = usePhaseLoop(P5_PHASES, P5_DUR)

  const arrowActive   = phase === "sliding" || phase === "delivering" || phase === "done"
  const buildingActive = phase === "delivering" || phase === "done"

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-5">
        {/* Printer */}
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{ scale: phase === "printing" ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.35 }}
          >
            <Printer className="h-14 w-14 text-primary" />
          </motion.div>

          {/* Paper coming out */}
          <AnimatePresence>
            {(phase === "printing" || phase === "sliding") && (
              <motion.div
                key="paper"
                className="absolute -bottom-7 flex w-10 flex-col gap-[3px] rounded-sm border bg-card px-1.5 py-1.5 shadow-sm"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 2, opacity: 1 }}
                exit={{ x: 55, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.38 }}
              >
                {[1, 1, 0.6].map((w, i) => (
                  <div
                    key={i}
                    className="h-px rounded-full bg-muted-foreground/30"
                    style={{ width: `${w * 100}%` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{
            x: arrowActive ? [0, 5, 0] : 0,
            opacity: arrowActive ? 1 : 0.25,
          }}
          transition={{ duration: 0.7, repeat: arrowActive ? Infinity : 0, ease: "easeInOut" }}
        >
          <ArrowRight className="h-6 w-6 text-primary/70" />
        </motion.div>

        {/* Building */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            animate={{
              scale: phase === "done" ? [1, 1.14, 1] : 1,
              opacity: buildingActive ? 1 : 0.35,
            }}
            transition={{ duration: 0.4 }}
          >
            <Building2
              className={cn(
                "h-14 w-14 transition-colors duration-500",
                buildingActive ? "text-primary" : "text-muted-foreground/40",
              )}
            />
          </motion.div>
          <span className="text-[11px] font-medium text-muted-foreground">Capacitación</span>
        </div>
      </div>

      {/* Done badge */}
      <div className="h-9 flex items-center">
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              key="done"
              className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-1.5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              <Check className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">¡Entregado!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
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
      "Presiona el botón Guardar. Si la calificación final es menor a 80%, deberás capturar los compromisos de mejora antes de poder guardar e imprimir.",
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

// ─── Slide variants ───────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -72 : 72, opacity: 0 }),
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
}

export function DesempenoGuia({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [dir, setDir]   = useState(1)

  const goTo = (next: number) => {
    if (next === step) return
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const handleClose = () => {
    try { localStorage.setItem(STORAGE_KEY, "1") } catch { /* SSR / private mode */ }
    onClose()
    setTimeout(() => setStep(0), 380)
  }

  const isLast = step === STEPS.length - 1
  const { Illus } = STEPS[step]

  return (
    <AnimatePresence>
      {open && (
        // ── Backdrop ──────────────────────────────────────────────────────────
        <motion.div
          key="guia-backdrop"
          className="fixed inset-0 z-[260] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={handleClose}
          aria-modal="true"
          role="dialog"
          aria-label="Guía de evaluación"
        >
          {/* ── Card ────────────────────────────────────────────────────────── */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
            initial={{ scale: 0.88, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.91, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Progress segments (clickable) ───────────────────────────── */}
            <div className="flex gap-1.5 px-5 pt-5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Ir al paso ${i + 1}`}
                  className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </button>
              ))}
            </div>

            {/* ── Step label + close ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <motion.span
                key={step}
                className="text-xs font-bold tabular-nums text-muted-foreground"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                PASO {STEPS[step].num} DE {STEPS.length.toString().padStart(2, "0")}
              </motion.span>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar guía"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Illustration area ────────────────────────────────────────── */}
            <div className="relative flex h-52 items-center justify-center overflow-hidden px-6">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="flex w-full items-center justify-center"
                >
                  <Illus />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Text ────────────────────────────────────────────────────── */}
            <div className="min-h-[88px] px-6 pb-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${step}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <h3 className="text-base font-bold text-foreground">
                    {STEPS[step].title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {STEPS[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Navigation ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo(step - 1)}
                disabled={step === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {/* Dot indicators */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Paso ${i + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === step
                        ? "w-4 h-2 bg-primary"
                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                  />
                ))}
              </div>

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
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Helper to check if the guide has been seen ───────────────────────────────
export function guiaYaVista(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY) } catch { return false }
}
