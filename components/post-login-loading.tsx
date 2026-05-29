"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { useRole } from "@/lib/hooks"

/**
 * PostLoginLoading — "Minimal Editorial"
 *
 * Pantalla de transición tras login. Sobre el fondo limpio del tema
 * (`--background`), centra el wordmark serif VIÑOPLASTIC, un filete,
 * la planta y una barra de progreso fina, con un caption de estado
 * real debajo. Resuelve al dashboard con un wipe diagonal de
 * `clip-path`.
 *
 * Tokens: todos los colores derivan del tema (`--background`,
 * `--foreground`, `--primary`, `--warning`, `--muted`, `--border`,
 * `--card`) en HSL. Las fuentes vienen de las variables
 * `--font-serif` y `--font-mono` declaradas en `app/layout.tsx` y
 * expuestas por Tailwind como `font-serif` / `font-mono`. Sin
 * hex/rgb ni `font-family` hardcoded.
 */

const MIN_MS = 6000
const EXIT_MS = 400
const WORDMARK = "VIÑOPLASTIC"
const SPLIT_AT = 4 // "VIÑO" | "PLASTIC"

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function PostLoginLoading() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("to") ?? "/"
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [minDone, setMinDone] = useState(false)
  const [exiting, setExiting] = useState(false)
  const didRedirect = useRef(false)

  // Enforce minimum display time so the animation plays fully
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  // Redirect once role is resolved and minimum time has passed
  useEffect(() => {
    if (roleLoading || !minDone || didRedirect.current) return
    didRedirect.current = true

    const destination = role === "evaluador" ? "/desempeno" : redirectTo

    setExiting(true)
    const t = setTimeout(() => router.replace(destination), EXIT_MS)
    return () => clearTimeout(t)
  }, [roleLoading, minDone, role, redirectTo, router])

  const statusLabel = roleLoading
    ? "Verificando acceso…"
    : !minDone
      ? "Preparando tu espacio…"
      : "Listo"

  // ── Variants ──────────────────────────────────────────────────────────
  const wordmarkContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.06,
        delayChildren: prefersReducedMotion ? 0 : 0.35,
      },
    },
  }

  const letter: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.55,
        ease: easeOutExpo,
      },
    },
  }

  // Diagonal wipe — top-right corner leaves first, bottom-left last
  const wipeIn = {
    clipPath: "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)",
    WebkitClipPath: "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)",
  }
  const wipeOut = {
    clipPath: "polygon(110% -10%, 130% -10%, 130% 110%, 130% 110%)",
    WebkitClipPath: "polygon(110% -10%, 130% -10%, 130% 110%, 130% 110%)",
  }

  // Outer fades in once; exit is handled entirely on the inner stage
  // so the dashboard color (bg-background) reveals through the wipe.
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy={!minDone || roleLoading}
      aria-label="Preparando tu espacio"
      className="vp-loader fixed inset-0 z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: easeOutExpo }}
    >
      <motion.div
        className="vp-stage absolute inset-0"
        initial={prefersReducedMotion ? { opacity: 1 } : { ...wipeIn, scale: 1.04 }}
        animate={
          exiting
            ? prefersReducedMotion
              ? { opacity: 0 }
              : { ...wipeOut, scale: 1 }
            : prefersReducedMotion
              ? { opacity: 1 }
              : { ...wipeIn, scale: 1 }
        }
        transition={{
          duration: prefersReducedMotion ? 0.3 : exiting ? 0.7 : 0.6,
          ease: easeOutExpo,
        }}
      >
        {/* ─── Background ─────────────────────────────────────────── */}
        <div className="vp-veil absolute inset-0" aria-hidden />

        {/* ─── Center column ──────────────────────────────────────── */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
          {/* Sello */}
          <motion.div
            className="vp-stamp mb-5 flex items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.32em] sm:text-xs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOutExpo, delay: 0.15 }}
          >
            <span className="vp-stamp__line" aria-hidden />
            <span>Desde 1970</span>
            <span className="vp-stamp__line" aria-hidden />
          </motion.div>

          {/* Wordmark letter-by-letter */}
          <motion.h1
            className="vp-title flex select-none items-baseline justify-center font-serif font-extrabold leading-none tracking-tight"
            variants={wordmarkContainer}
            initial="hidden"
            animate="visible"
            aria-label="Viñoplastic"
          >
            {WORDMARK.split("").map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                variants={letter}
                className={i < SPLIT_AT ? "vp-title__a" : "vp-title__b"}
                aria-hidden
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>

          {/* Filete decorativo */}
          <motion.div
            className="vp-rule mt-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.95 }}
            aria-hidden
          >
            <span className="vp-rule__line" />
            <em className="vp-rule__dot font-serif italic">·</em>
            <span className="vp-rule__line" />
          </motion.div>

          {/* Subtítulo */}
          <motion.p
            className="vp-sub mt-3 font-serif text-sm tracking-wide sm:text-base"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOutExpo, delay: 1.05 }}
          >
            <i className="vp-sub__accent">Planta</i>
            <span>&nbsp;Querétaro</span>
          </motion.p>

          {/* Progress line */}
          <motion.div
            className="vp-progress mt-9 h-px w-[min(420px,72vw)] origin-left overflow-hidden"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0.3 : 1.6,
              ease: easeOutExpo,
              delay: prefersReducedMotion ? 0.2 : 1.3,
            }}
          >
            <span className="vp-progress__fill block h-full w-full" aria-hidden />
          </motion.div>

          {/* Caption de estado real */}
          <motion.p
            className="vp-status mt-6 flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.28em]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 1.9,
              duration: 0.5,
              ease: easeOutExpo,
            }}
            aria-hidden
          >
            <span className="vp-status__dot" aria-hidden />
            {statusLabel}
          </motion.p>

          <span className="sr-only">{statusLabel}</span>
        </div>
      </motion.div>

      {/* ─── Local styles ──────────────────────────────────────────── */}
      <style jsx>{`
        /* ============================================================
           Tokens locales — todos derivan del tema (--background,
           --foreground, --primary, --warning, --muted, --border,
           --card). Sin hex/rgb ni font-family hardcoded.
           ============================================================ */
        .vp-loader {
          --brand: hsl(var(--primary));
          --brand-soft: hsl(var(--primary) / 0.1);
          --accent: hsl(var(--warning));
          --text: hsl(var(--foreground));
          --text-mute: hsl(var(--muted-foreground));
          --text-faint: hsl(var(--muted-foreground) / 0.55);
          --line: hsl(var(--border));

          color: var(--text);
          isolation: isolate;
        }
        /* Stage paints the theme background so the wipe reveals
           whatever the parent route paints behind it (dashboard). */
        .vp-stage {
          background: hsl(var(--background));
          isolation: isolate;
          will-change: clip-path, transform;
        }

        /* Veladura sutil — un solo halo estático de marca */
        .vp-veil {
          background: radial-gradient(
            120% 90% at 50% 12%,
            var(--brand-soft) 0%,
            transparent 55%
          );
        }

        /* Sello ──────────────────────────────────────────────── */
        .vp-stamp {
          color: var(--text-mute);
        }
        .vp-stamp__line {
          display: inline-block;
          height: 1px;
          width: 2.25rem;
          background: linear-gradient(
            90deg,
            transparent,
            var(--text-faint),
            transparent
          );
        }

        /* Wordmark ───────────────────────────────────────────── */
        .vp-title {
          font-size: clamp(2.2rem, 8vw, 4.5rem);
          font-feature-settings: "ss01", "ss02", "liga";
          letter-spacing: -0.01em;
        }
        .vp-title__a {
          color: var(--text);
        }
        .vp-title__b {
          color: var(--brand);
        }

        /* Filete ─────────────────────────────────────────────── */
        .vp-rule__line {
          display: inline-block;
          height: 1px;
          width: 1.75rem;
          background: linear-gradient(
            90deg,
            transparent,
            var(--text-faint),
            transparent
          );
        }
        .vp-rule__dot {
          color: var(--accent);
          font-size: 0.875rem;
          line-height: 1;
        }

        /* Subtítulo ──────────────────────────────────────────── */
        .vp-sub {
          color: var(--text-mute);
          font-style: normal;
        }
        .vp-sub__accent {
          color: var(--accent);
          font-style: italic;
        }

        /* Progress ───────────────────────────────────────────── */
        .vp-progress {
          border-radius: 999px;
          background: hsl(var(--muted));
        }
        .vp-progress__fill {
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--brand) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: vp-shimmer 2.4s ease-in-out infinite;
        }

        /* Caption de estado ──────────────────────────────────── */
        .vp-status {
          color: var(--text-mute);
        }
        .vp-status__dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          animation: vp-pulse 2.4s ease-in-out infinite;
        }

        /* Keyframes ──────────────────────────────────────────── */
        @keyframes vp-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
        @keyframes vp-shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }

        /* Reduced motion ─────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .vp-status__dot,
          .vp-progress__fill {
            animation: none;
          }
        }
        :global(.reduce-motion) .vp-status__dot,
        :global(.reduce-motion) .vp-progress__fill {
          animation: none;
        }
      `}</style>
    </motion.div>
  )
}
