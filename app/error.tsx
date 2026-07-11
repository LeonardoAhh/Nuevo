"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { AlertCircle, ArrowLeft, RotateCcw, Wifi } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────
// Animation constants
// ─────────────────────────────────────────────────────────────────────

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease, delay },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, ease, delay },
})

// ─────────────────────────────────────────────────────────────────────
// Route error boundary
// ─────────────────────────────────────────────────────────────────────

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const reduced = useReducedMotion()

  useEffect(() => {
    console.error("[app/error]", error)
  }, [error])

  const code = error.digest ? `#${error.digest}` : null

  return (
    <main
      className="relative flex min-h-[60dvh] items-center justify-center overflow-hidden px-5 py-16"
      aria-labelledby="error-heading"
    >
      {/* ── Background atmosphere ─────────────────────────────── */}
      <BgAtmosphere />

      {/* ── Central card ─────────────────────────────────────── */}
      <motion.div
        {...(reduced ? {} : fadeUp(0))}
        className="relative z-10 w-full max-w-lg"
      >
        {/* MockFrame chrome */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
          {/* Window chrome bar */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
            </div>
            <div className="font-mono text-[0.55rem] uppercase tracking-[0.28em] text-muted-foreground">
              {code ?? "runtime · exception"}
            </div>
            <div className="w-12" aria-hidden />
          </div>

          {/* Body */}
          <div className="p-8 sm:p-10">
            {/* Icon with pulsing ring */}
            <motion.div
              {...(reduced ? {} : fadeIn(0.1))}
              className="mb-8 flex items-start justify-between"
            >
              <div className="relative inline-flex">
                {/* Ring pulse */}
                {!reduced && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-destructive/20"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    aria-hidden
                  />
                )}
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" aria-hidden />
                </span>
              </div>

              {/* Pill badge */}
              <motion.span
                {...(reduced ? {} : fadeIn(0.25))}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/8 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-destructive"
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full bg-destructive",
                    reduced ? "" : "animate-pulse",
                  ].join(" ")}
                  aria-hidden
                />
                Error inesperado
              </motion.span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              id="error-heading"
              {...(reduced ? {} : fadeUp(0.15))}
              className="font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            >
              Algo salió{" "}
              <span className="bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent">
                mal
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              {...(reduced ? {} : fadeUp(0.22))}
              className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              No pudimos mostrar esta sección. Intenta de nuevo; si el problema
              continúa, recarga la página.
            </motion.p>

            {/* Digest detail — only when present */}
            {code && (
              <motion.div
                {...(reduced ? {} : fadeIn(0.3))}
                className="mt-5 flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3"
              >
                <Wifi
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="font-mono text-xs text-muted-foreground">
                  Código de referencia:{" "}
                  <span className="font-semibold text-foreground">{code}</span>
                </span>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div
              {...(reduced ? {} : fadeIn(0.35))}
              className="my-8 h-px bg-border"
              aria-hidden
            />

            {/* Actions */}
            <motion.div
              {...(reduced ? {} : fadeUp(0.4))}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={reset}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-background transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 active:scale-[0.98]"
                aria-label="Reintentar cargar la sección"
              >
                <RotateCcw
                  className={[
                    "h-3.5 w-3.5 transition-transform",
                    reduced ? "" : "group-hover:-rotate-180 duration-500",
                  ].join(" ")}
                  aria-hidden
                />
                Reintentar
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Ir al inicio
              </Link>
            </motion.div>
          </div>

          {/* Footer strip */}
          <motion.div
            {...(reduced ? {} : fadeIn(0.5))}
            className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3"
          >
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
              Vinoplastic · Planta Querétaro
            </span>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground/60">
              App Error
            </span>
          </motion.div>
        </div>

        {/* Subtle caption below card */}
        <motion.p
          {...(reduced ? {} : fadeIn(0.55))}
          className="mt-4 text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground/50"
        >
          Este error no debería ocurrir. Si lo hace, por favor reporta este incidente al equipo de TI para su investigación.
        </motion.p>
      </motion.div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Background atmosphere — purely decorative
// ─────────────────────────────────────────────────────────────────────

function BgAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      role="presentation"
    >
      {/* Warm destructive glow top-left */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-destructive/8 blur-[100px]" />
      {/* Cool glow bottom-right */}
      <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-primary/6 blur-[90px]" />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
        }}
      />
    </div>
  )
}