"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno"

// ─── Constantes ───────────────────────────────────────────────────────────────
const AUTO_CLOSE_MS = 2800

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2
  const dist = 80 + Math.random() * 60
  return {
    tx: Math.cos(angle) * dist,
    ty: Math.sin(angle) * dist - 30,
    size: 4 + Math.random() * 5,
    delay: Math.random() * 0.15,
    rotation: Math.random() * 360,
    color: [
      "bg-primary",
      "bg-primary/70",
      "bg-blue-400",
      "bg-emerald-400",
      "bg-amber-400",
      "bg-rose-400",
    ][i % 6],
    shape: i % 3 === 0 ? "rounded-full" : i % 3 === 1 ? "rounded-sm" : "rounded-none",
  }
})

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedScore({ value, reduce }: { value: number; reduce: boolean | null }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const delay = setTimeout(() => requestAnimationFrame(tick), 900)
    return () => clearTimeout(delay)
  }, [value, reduce])

  return <>{display}</>
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface DesempenoSaveSuccessProps {
  visible: boolean
  nombre?: string
  calificacion?: number
  onDone: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function DesempenoSaveSuccess({
  visible,
  nombre,
  calificacion,
  onDone,
}: DesempenoSaveSuccessProps) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [visible, onDone])


  if (!mounted) return null

  const score = calificacion !== undefined ? calificacion : undefined
  const isGood = score !== undefined && score >= UMBRAL_CALIFICACION_APROBATORIA

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={(e) => e.stopPropagation()}
          role="status"
          aria-live="polite"
          aria-label={`Evaluación guardada${nombre ? ` para ${nombre}` : ""}${score !== undefined ? `. Calificación: ${score}%` : ""}`}
        >
          <motion.div
            className="relative flex w-[320px] flex-col items-center gap-6 overflow-hidden rounded-2xl border border-border/40 bg-card p-8 pt-10 shadow-2xl"
            initial={{ scale: 0.5, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* ── Confetti ─────────────────────────────────────────────── */}
            {!reduce && CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                className={`pointer-events-none absolute ${c.color} ${c.shape}`}
                style={{
                  width: c.size,
                  height: c.size * (c.shape === "rounded-full" ? 1 : 0.6),
                  left: "50%",
                  top: "25%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: c.tx,
                  y: c.ty,
                  opacity: 0,
                  scale: 1,
                  rotate: c.rotation,
                }}
                transition={{
                  duration: 0.9,
                  delay: 0.3 + c.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}

            {/* ── Checkmark circle ─────────────────────────────────────── */}
            <div className="relative flex items-center justify-center">
              {/* Ripple */}
              {!reduce && (
                <motion.div
                  className="absolute h-24 w-24 rounded-full border border-primary/20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: [0.5, 0] }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                />
              )}

              {/* Circle bg */}
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: reduce ? 1 : [0, 1.2, 1] }}
                transition={{
                  duration: reduce ? 0 : 0.5,
                  times: [0, 0.6, 1],
                  ease: "easeOut",
                  delay: reduce ? 0 : 0.1,
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.45, duration: 0.3, type: "spring", stiffness: 300 }}
                >
                  <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              </motion.div>
            </div>

            {/* ── Texto ────────────────────────────────────────────────── */}
            <motion.div
              className="relative z-10 space-y-1 text-center"
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-base font-bold text-foreground">¡Evaluación guardada!</p>
              {nombre && (
                <p className="text-xs text-muted-foreground leading-relaxed">{nombre}</p>
              )}
            </motion.div>

            {/* ── Score ─────────────────────────────────────────────────── */}
            {score !== undefined && (
              <motion.div
                className="relative z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: reduce ? 0 : 0.7 }}
              >
                <div className={`
                  flex items-baseline gap-0.5 rounded-xl px-5 py-2
                  ${isGood
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }
                `}>
                  <span className="text-3xl font-black tabular-nums">
                    <AnimatedScore value={score} reduce={reduce} />
                  </span>
                  <span className="text-lg font-bold">%</span>
                </div>
              </motion.div>
            )}

            {/* ── Progress bar ──────────────────────────────────────────── */}
            <motion.div
              className="absolute bottom-0 left-0 h-[3px] bg-primary/40"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
