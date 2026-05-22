"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Particle config ────────────────────────────────────────────────────────
// Each particle shoots from the center toward a random direction and fades out.
const PARTICLES: { tx: number; ty: number; size: number; delay: number; opacity: number }[] = [
  { tx: -72, ty: -110, size: 10, delay: 0.05, opacity: 0.9 },
  { tx:  48, ty: -130, size:  7, delay: 0.10, opacity: 0.7 },
  { tx: -40, ty: -150, size:  9, delay: 0.03, opacity: 0.8 },
  { tx:  80, ty:  -90, size:  6, delay: 0.15, opacity: 0.6 },
  { tx: -90, ty:  -70, size:  8, delay: 0.08, opacity: 0.75 },
  { tx:  30, ty: -160, size: 11, delay: 0.12, opacity: 0.65 },
  { tx: -55, ty: -125, size:  6, delay: 0.18, opacity: 0.7 },
  { tx:  65, ty: -140, size:  8, delay: 0.06, opacity: 0.85 },
  { tx: -20, ty:  -95, size:  5, delay: 0.20, opacity: 0.6 },
  { tx:  55, ty: -115, size:  7, delay: 0.14, opacity: 0.8 },
]

// Auto-close after this many ms (must match the progress-bar animation duration)
const AUTO_CLOSE_MS = 5500

interface Props {
  visible: boolean
  nombre?: string
  calificacion?: number
  onDone: () => void
}

export function DesempenoSaveSuccess({ visible, nombre, calificacion, onDone }: Props) {
  // Auto-dismiss
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [visible, onDone])

  return (
    <AnimatePresence>
      {visible && (
        // ── Backdrop ────────────────────────────────────────────────────────
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-background/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onDone}
        >
          {/* ── Card ──────────────────────────────────────────────────────── */}
          <motion.div
            className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border/60 bg-card px-12 py-10 shadow-2xl"
            initial={{ scale: 0.65, opacity: 0, y: 50, rotate: -3 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 230, damping: 18, delay: 0.04 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Soft background glow ──────────────────────────────────── */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-3xl bg-primary/5"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── Particles ─────────────────────────────────────────────── */}
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute rounded-full bg-primary"
                style={{
                  width: p.size,
                  height: p.size,
                  // Start from the visual center of the card
                  left: "50%",
                  top: "42%",
                  marginLeft: -(p.size / 2),
                  marginTop: -(p.size / 2),
                }}
                initial={{ x: 0, y: 0, opacity: p.opacity, scale: 0 }}
                animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 1 }}
                transition={{
                  duration: 0.75,
                  delay: p.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}

            {/* ── Checkmark SVG ─────────────────────────────────────────── */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Ripple ring */}
              <motion.div
                className="absolute h-28 w-28 rounded-full border-2 border-primary/20"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.1, delay: 0.55, ease: "easeOut" }}
              />
              {/* Fill ring */}
              <motion.div
                className="absolute h-20 w-20 rounded-full bg-primary/10"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.15, 1] }}
                transition={{ duration: 0.45, times: [0, 0.65, 1], ease: "easeOut", delay: 0.08 }}
              />

              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
                className="relative z-10"
                aria-hidden
              >
                {/* Circle outline */}
                <motion.circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: -90 }}
                  animate={{ pathLength: 1, rotate: -90 }}
                  style={{ originX: "36px", originY: "36px" }}
                  transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1], delay: 0.12 }}
                />
                {/* Checkmark */}
                <motion.path
                  d="M22 37 L31 46 L50 27"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.38, ease: "easeOut", delay: 0.78 }}
                />
              </svg>
            </div>

            {/* ── Text ──────────────────────────────────────────────────── */}
            <motion.div
              className="relative z-10 space-y-1.5 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-lg font-bold text-foreground">¡Evaluación guardada!</p>
              {nombre && (
                <p className="text-sm text-muted-foreground">{nombre}</p>
              )}
            </motion.div>

            {/* ── Score badge ───────────────────────────────────────────── */}
            {calificacion !== undefined && (
              <motion.div
                className="relative z-10 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.9 }}
              >
                <span className="rounded-full border border-primary/30 bg-primary/10 px-5 py-1.5 text-2xl font-bold tabular-nums text-primary">
                  {calificacion % 1 === 0 ? calificacion : calificacion.toFixed(1)}%
                </span>
              </motion.div>
            )}

            {/* ── Auto-close progress bar ───────────────────────────────── */}
            <motion.div
              className="absolute bottom-0 left-0 h-[3px] rounded-full bg-primary/50"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
