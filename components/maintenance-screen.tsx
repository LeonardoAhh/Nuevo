"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Settings } from "lucide-react"
import { StatusCaption, StatusShell } from "@/components/ui/status-shell"

/**
 * Full-screen lock shown in production while maintenance mode is active.
 * Shares the StatusShell surface with the error boundary (same tokens,
 * density, typography and motion behavior).
 */

/* Indeterminate progress — not expressible in pure Tailwind.
   Honors both the OS setting and the app's .reduce-motion toggle
   (globals.css already neutralizes CSS animations for it). */
const PROGRESS_STYLES = `
  .status-progress-track {
    height: 4px;
    border-radius: 6px;
    overflow: hidden;
    background-color: hsl(var(--border));
  }
  .status-progress-bar {
    height: 100%;
    width: 40%;
    border-radius: 6px;
    background-color: hsl(var(--primary));
    animation: statusIndeterminate 2s ease-in-out infinite;
  }
  @keyframes statusIndeterminate {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .status-progress-bar { animation: none; transform: translateX(125%); }
  }
`

export function MaintenanceScreen() {
  const reduced = useReducedMotion()

  return (
    <>
      <style>{PROGRESS_STYLES}</style>

      <StatusShell
        icon={Settings}
        tone="primary"
        eyebrow="Sistema en mantenimiento"
        title="Estamos aplicando una actualización"
        description="El sistema estará disponible en unos minutos. No necesitas hacer nada; la página volverá por sí sola."
        labelledBy="maintenance-heading"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="mt-7"
        >
          <div
            className="status-progress-track"
            role="progressbar"
            aria-label="Actualización en progreso"
            aria-valuetext="Progreso indeterminado"
          >
            <div className="status-progress-bar" />
          </div>
        </motion.div>
      </StatusShell>

      <StatusCaption className="fixed inset-x-0 bottom-4 px-4 text-center">
        Vinoplastic · Planta Querétaro — Mantenimiento programado
      </StatusCaption>
    </>
  )
}
