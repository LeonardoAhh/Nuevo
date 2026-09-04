"use client"

import { useEffect, useId, useState } from "react"
import { Clock3, Layers3, Radio, RefreshCw } from "lucide-react"

const COUNTDOWN_UNITS = [
  { label: "Días", seconds: 86400, modulo: null },
  { label: "Horas", seconds: 3600, modulo: 24 },
  { label: "Minutos", seconds: 60, modulo: 60 },
  { label: "Segundos", seconds: 1, modulo: 60 },
] as const

/** Uses the shared theme, typography and density tokens of the status surfaces. */
export function MaintenanceScreen({ endsAt = null }: { endsAt?: string | null }) {
  const id = useId()
  const [now, setNow] = useState<number | null>(null)
  const deadline = endsAt ? Date.parse(endsAt) : NaN
  const hasDeadline = Number.isFinite(deadline)
  const remaining = hasDeadline && now !== null
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : null
  const estimateElapsed = remaining === 0

  useEffect(() => {
    if (!hasDeadline) return
    const tick = () => setNow(Date.now())
    const initial = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 1000)
    // Recalculate from the deadline after a suspended/background tab resumes.
    window.addEventListener("focus", tick)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
      window.removeEventListener("focus", tick)
    }
  }, [hasDeadline])

  return (
    <main
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
      className="relative isolate flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/5 to-transparent" />
      </div>
      <div className="w-full max-w-4xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Estado del sistema</p>
          <span className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <Radio className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Mantenimiento activo
          </span>
        </header>
        <article aria-labelledby={`${id}-heading`} className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col items-start p-6 sm:p-8 lg:p-10">
              <div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Layers3 className="size-7" strokeWidth={1.5} />
              </div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Sistema en mantenimiento</p>
              <h1 id={`${id}-heading`} className="text-balance font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Actualización en curso
              </h1>
              <p id={`${id}-description`} className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Durante este tiempo, el acceso a la plataforma estará temporalmente deshabilitado.
              </p>
            </div>
            <section aria-labelledby={`${id}-countdown`} className="flex min-w-0 flex-col justify-center gap-5 border-t border-border bg-muted/30 p-6 sm:p-8 md:border-l md:border-t-0 lg:p-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <h2 id={`${id}-countdown`} className="text-sm font-medium text-foreground">
                  {hasDeadline ? "Tiempo estimado restante" : "Actualización en curso"}
                </h2>
              </div>
              {hasDeadline ? (
                <div role="timer" aria-labelledby={`${id}-countdown`} aria-live="off">
                  <dl className="grid grid-cols-2 gap-3 xs:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                    {COUNTDOWN_UNITS.map(({ label, seconds, modulo }) => {
                      const total = remaining === null ? null : Math.floor(remaining / seconds)
                      const value = total === null ? null : modulo === null ? total : total % modulo
                      return (
                        <div key={label} className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-4 shadow-sm">
                          <dt className="order-2 text-xs text-muted-foreground">{label}</dt>
                          <dd className="font-mono text-3xl font-medium leading-none tracking-tight tabular-nums text-foreground">
                            {value === null ? "—" : String(value).padStart(2, "0")}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              ) : (
                <p className="font-serif text-2xl font-semibold tracking-tight">Volvemos en cuanto esté listo.</p>
              )}
              <div role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-relaxed text-muted-foreground">
                {estimateElapsed
                  ? "La actualización necesita un poco más de tiempo. Gracias por tu paciencia."
                  : hasDeadline
                    ? "Este tiempo es aproximado."
                    : "Todavía no hay una hora estimada de regreso. El acceso volverá aquí cuando el sistema esté disponible."}
              </div>
              {hasDeadline && now !== null && (
                <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  Fin estimado: <time dateTime={new Date(deadline).toISOString()} className="font-medium text-foreground">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(deadline)}
                  </time>
                  <span className="mt-1 block">Hora local de tu dispositivo</span>
                </p>
              )}
            </section>
          </div>
          <footer className="flex items-start gap-3 border-t border-border px-6 py-5 sm:px-8 lg:px-10">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Volverás automáticamente</p>
              <p className="text-sm leading-relaxed text-muted-foreground">El acceso se restablecerá cuando termine el mantenimiento.</p>
            </div>
          </footer>
        </article>
        <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">ViñoPlastic Planta Querétaro - Capacitación - Recursos Humanos.</p>
      </div>
    </main>
  )
}
