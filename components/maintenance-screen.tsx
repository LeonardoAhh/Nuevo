"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
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

export function MaintenanceScreen({ endsAt = null }: { endsAt?: string | null }) {
  const reduced = useReducedMotion()
  const [now, setNow] = useState<number | null>(null)
  const deadline = endsAt ? Date.parse(endsAt) : NaN
  const hasDeadline = Number.isFinite(deadline)
  const remaining = hasDeadline && now !== null ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null
  const finished = remaining === 0
  useEffect(() => {
    if (!hasDeadline) return
    const tick = () => setNow(Date.now())
    const initial = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 1000)
    return () => { window.clearTimeout(initial); window.clearInterval(timer) }
  }, [hasDeadline])
  const units = remaining === null ? [] : [
    { label: "Días", value: Math.floor(remaining / 86400) },
    { label: "Horas", value: Math.floor(remaining / 3600) % 24 },
    { label: "Minutos", value: Math.floor(remaining / 60) % 60 },
    { label: "Segundos", value: remaining % 60 },
  ]

  return (
    <>
      <style>{PROGRESS_STYLES}</style>

      <StatusShell
        icon={Settings}
        tone="primary"
        eyebrow="Sistema en mantenimiento"
        title="Estamos aplicando una actualización"
        description="Estamos trabajando para mejorar el sistema. No necesitas hacer nada; la página volverá por sí sola cuando termine el mantenimiento."
        labelledBy="maintenance-heading"
      >
        {hasDeadline && (
          <div className="mt-7">
            <p className="mb-3 text-sm text-muted-foreground" role="status">
              {finished ? "Estamos finalizando la actualización. Gracias por tu paciencia." : "Tiempo estimado restante"}
            </p>
            <div role="timer" aria-label="Tiempo estimado restante" aria-live="off" className="grid grid-cols-4 gap-2">
              {(units.length ? units : ["Días", "Horas", "Minutos", "Segundos"].map(label => ({ label, value: null }))).map(({ label, value }) => (
                <div key={label} className="min-w-0 rounded-xl border border-border bg-muted/30 px-1 py-3 text-center">
                  <span className="block font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{value === null ? "--" : String(value).padStart(2, "0")}</span>
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
