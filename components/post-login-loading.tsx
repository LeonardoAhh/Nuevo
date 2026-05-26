"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { useRole, type AppRole } from "@/lib/hooks"

/**
 * PostLoginLoading — "Industrial Bloom"
 *
 * Pantalla de transición tras login. Extiende el lenguaje editorial
 * del LoginHero (panel oscuro derivado de `--primary`, beam, grid,
 * orbes, sello mono "Desde 1970") y resuelve al dashboard con un
 * wipe diagonal de `clip-path`.
 *
 * Tokens: todos los colores derivan de `--primary`, `--warning` y
 * `--primary-foreground` (HSL del tema). Las fuentes vienen de las
 * variables `--font-serif` y `--font-mono` declaradas en
 * `app/layout.tsx` y expuestas por Tailwind como `font-serif` /
 * `font-mono`. Sin hex/rgb ni `font-family` hardcoded.
 */

const MIN_MS = 4500
const EXIT_MS = 700
const WORDMARK = "VIÑOPLASTIC"
const SPLIT_AT = 4 // "VIÑO" | "PLASTIC"

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]

const roleLabel = (role: AppRole | null | undefined, loading: boolean) => {
  if (loading) return "RESOLVING"
  switch (role) {
    case "dev":
      return "DEV"
    case "admin":
      return "ADMIN"
    case "evaluador":
      return "EVALUADOR"
    default:
      return "USUARIO"
  }
}

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

  const tags = useMemo(
    () => [
      { k: "AUTH", v: "OK" },
      { k: "ROLE", v: roleLabel(role, roleLoading) },
      { k: "READY", v: minDone && !roleLoading ? "TRUE" : "…" },
    ],
    [role, roleLoading, minDone],
  )

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
        {/* ─── Background layers ──────────────────────────────────── */}
        <div className="vp-base absolute inset-0" aria-hidden />
        <div className="vp-conic absolute -inset-1/4" aria-hidden />

        <span className="vp-orb vp-orb--a" aria-hidden />
        <span className="vp-orb vp-orb--b" aria-hidden />
        <span className="vp-orb vp-orb--c" aria-hidden />

        <span className="vp-beam absolute" aria-hidden />
        <div className="vp-grid absolute inset-0" aria-hidden />
        <div className="vp-grain absolute inset-0" aria-hidden />

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

          {/* Status tags */}
          <motion.div
            className="vp-tags mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            {tags.map((t, i) => (
              <motion.span
                key={t.k}
                className="vp-tag inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.22em]"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 2.0 + i * 0.18,
                  duration: 0.45,
                  ease: easeOutExpo,
                }}
              >
                <span className="vp-tag__dot" aria-hidden />
                <span className="vp-tag__k">{t.k}</span>
                <span className="vp-tag__sep" aria-hidden>
                  ·
                </span>
                <span className="vp-tag__v">{t.v}</span>
              </motion.span>
            ))}
          </motion.div>

          <span className="sr-only">Preparando tu espacio…</span>
        </div>
      </motion.div>

      {/* ─── Local styles ──────────────────────────────────────────── */}
      <style jsx>{`
        /* ============================================================
           Tokens locales — todos derivan del tema (--primary, --warning,
           --primary-foreground). Sin hex/rgb hardcoded; solo keywords
           CSS (black/white) para los mix de oscuridad/transparencia.
           ============================================================ */
        .vp-loader {
          --p: var(--primary, 221 62% 55%);
          --p-soft: hsl(var(--p) / 0.18);
          --accent: hsl(var(--warning, 38 70% 48%));
          --accent-soft: hsl(var(--warning, 38 70% 48%) / 0.35);
          --ink: color-mix(in oklab, hsl(var(--p)) 78%, black 22%);
          --ink-deep: color-mix(in oklab, hsl(var(--p)) 35%, black 65%);
          --ink-base: color-mix(in oklab, hsl(var(--p)) 12%, black 88%);
          --text: hsl(var(--primary-foreground, 0 0% 98%));
          --text-mute: hsl(var(--primary-foreground, 0 0% 98%) / 0.62);
          --text-faint: hsl(var(--primary-foreground, 0 0% 98%) / 0.38);
          --line: hsl(var(--primary-foreground, 0 0% 98%) / 0.09);

          color: var(--text);
          isolation: isolate;
        }
        /* Stage holds the dark backdrop so the wipe reveals whatever
           the parent route paints behind it (dashboard bg-background). */
        .vp-stage {
          background: var(--ink-base);
          isolation: isolate;
          will-change: clip-path, transform;
        }

        /* Capa 0 · base + halo cónico ──────────────────────────── */
        .vp-base {
          background:
            radial-gradient(120% 80% at 50% 20%, var(--ink) 0%, transparent 60%),
            radial-gradient(80% 60% at 80% 100%, var(--p-soft) 0%, transparent 70%),
            linear-gradient(180deg, var(--ink-deep) 0%, var(--ink-base) 100%);
        }
        .vp-conic {
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            hsl(var(--p) / 0.35) 60deg,
            transparent 140deg,
            hsl(var(--p) / 0.22) 220deg,
            transparent 300deg,
            hsl(var(--p) / 0.35) 360deg
          );
          opacity: 0.55;
          mix-blend-mode: screen;
          filter: blur(70px);
          animation: vp-spin 38s linear infinite;
        }

        /* Capa 1 · orbes ─────────────────────────────────────── */
        .vp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          mix-blend-mode: screen;
          opacity: 0.85;
          will-change: transform;
        }
        .vp-orb--a {
          width: 32rem;
          height: 32rem;
          left: -8rem;
          top: -10rem;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.95), transparent 70%);
          animation: vp-drift-a 18s ease-in-out infinite;
        }
        .vp-orb--b {
          width: 26rem;
          height: 26rem;
          right: -6rem;
          bottom: -8rem;
          background: radial-gradient(
            closest-side,
            hsl(var(--p) / 0.7) 0%,
            var(--accent-soft) 60%,
            transparent 80%
          );
          animation: vp-drift-b 22s ease-in-out infinite;
        }
        .vp-orb--c {
          width: 18rem;
          height: 18rem;
          left: 55%;
          top: 60%;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.55), transparent 70%);
          animation: vp-drift-c 26s ease-in-out infinite;
        }

        /* Capa 2 · beam diagonal ─────────────────────────────── */
        .vp-beam {
          inset: -20% -40%;
          background: linear-gradient(
            115deg,
            transparent 40%,
            hsl(var(--primary-foreground, 0 0% 98%) / 0.06) 48%,
            hsl(var(--primary-foreground, 0 0% 98%) / 0.14) 50%,
            hsl(var(--primary-foreground, 0 0% 98%) / 0.06) 52%,
            transparent 60%
          );
          animation: vp-beam 9s ease-in-out infinite;
          pointer-events: none;
        }

        /* Capa 3 · grid técnico ──────────────────────────────── */
        .vp-grid {
          background-image:
            linear-gradient(var(--line) 1px, transparent 1px),
            linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(
            ellipse 70% 60% at 50% 50%,
            black 30%,
            transparent 80%
          );
          -webkit-mask-image: radial-gradient(
            ellipse 70% 60% at 50% 50%,
            black 30%,
            transparent 80%
          );
          opacity: 0.5;
        }

        /* Capa 4 · grano ─────────────────────────────────────── */
        .vp-grain {
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          background-size: 200px 200px;
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
          color: transparent;
          background: linear-gradient(
            90deg,
            var(--accent) 0%,
            hsl(var(--p) / 0.9) 60%,
            var(--text) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
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
          background: hsl(var(--primary-foreground, 0 0% 98%) / 0.06);
        }
        .vp-progress__fill {
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--accent) 40%,
            hsl(var(--p) / 1) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: vp-shimmer 2.4s ease-in-out infinite;
        }

        /* Tags ───────────────────────────────────────────────── */
        .vp-tag {
          color: var(--text-faint);
          padding: 0.3rem 0.65rem;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: hsl(var(--primary-foreground, 0 0% 98%) / 0.02);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .vp-tag__k {
          color: var(--text-mute);
        }
        .vp-tag__sep {
          color: var(--text-faint);
          opacity: 0.7;
        }
        .vp-tag__v {
          color: var(--accent);
          font-variant-numeric: tabular-nums;
        }
        .vp-tag__dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow:
            0 0 0 2px hsl(var(--warning, 38 70% 48%) / 0.18),
            0 0 10px var(--accent);
          animation: vp-pulse 2.4s ease-in-out infinite;
        }

        /* Keyframes ──────────────────────────────────────────── */
        @keyframes vp-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes vp-drift-a {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, 40px) scale(1.05);
          }
        }
        @keyframes vp-drift-b {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, -30px) scale(1.08);
          }
        }
        @keyframes vp-drift-c {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -25px) scale(0.95);
          }
        }
        @keyframes vp-beam {
          0% {
            transform: translateX(-30%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translateX(30%);
            opacity: 0;
          }
        }
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
          .vp-conic,
          .vp-orb,
          .vp-beam,
          .vp-tag__dot,
          .vp-progress__fill {
            animation: none;
          }
        }
        :global(.reduce-motion) .vp-conic,
        :global(.reduce-motion) .vp-orb,
        :global(.reduce-motion) .vp-beam,
        :global(.reduce-motion) .vp-tag__dot,
        :global(.reduce-motion) .vp-progress__fill {
          animation: none;
        }
      `}</style>
    </motion.div>
  )
}
