"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { useRole } from "@/lib/hooks"

const MIN_MS = 3500
const EXIT_MS = 500

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function PostLoginLoading() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("to") ?? "/"
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [minDone, setMinDone] = useState(false)
  const [exiting, setExiting] = useState(false)
  const didRedirect = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (roleLoading || !minDone || didRedirect.current) return
    didRedirect.current = true
    const destination = role === "evaluador" ? "/desempeno" : redirectTo
    setExiting(true)
    const t = setTimeout(() => router.replace(destination), EXIT_MS)
    return () => clearTimeout(t)
  }, [roleLoading, minDone, role, redirectTo, router])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy={!minDone || roleLoading}
      aria-label="Cargando"
      className="vp-loader fixed inset-0 z-[9999]"
      initial={{ opacity: 0 }}
      animate={exiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease }}
    >
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <motion.p
          className="vp-wordmark"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
        >
          Viño<span className="vp-wordmark__dim">plastic</span>
        </motion.p>

        <motion.p
          className="vp-sub"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.45 }}
        >
          Planta Querétaro
        </motion.p>

        <motion.span
          className="vp-ring"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          aria-hidden
        />

        <span className="sr-only">Cargando…</span>
      </div>

      <motion.div
        className="vp-prog-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        aria-hidden
      >
        <span className="vp-prog" />
      </motion.div>

      <motion.p
        className="vp-bottom-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        aria-hidden
      >
        Cargando
      </motion.p>

      <style jsx>{`
        /* ─── Tokens ─────────────────────────────────────────────
           Tu proyecto usa HSL sin hsl() en las variables, por lo
           que hay que envolver con hsl(). Ejemplo:
           --background: 220 14% 96%  →  hsl(var(--background))
           ─────────────────────────────────────────────────────── */
        .vp-loader {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        /* Wordmark */
        .vp-wordmark {
          font-size: clamp(2rem, 7vw, 3.5rem);
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.35rem;
          color: hsl(var(--foreground));
        }
        .vp-wordmark__dim {
          color: hsl(var(--muted-foreground));
        }

        /* Subtítulo */
        .vp-sub {
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          color: hsl(var(--muted-foreground));
          margin-bottom: 2.5rem;
        }

        /* Spinner — usa --primary como tu LoginHero */
        .vp-ring {
          display: block;
          width: 22px;
          height: 22px;
          border: 1.5px solid hsl(var(--border));
          border-top-color: hsl(var(--primary));
          border-radius: 50%;
          animation: vp-spin 0.9s linear infinite;
        }

        /* Progress */
        .vp-prog-wrap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background-color: hsl(var(--border));
          overflow: hidden;
        }
        .vp-prog {
          display: block;
          height: 100%;
          width: 40%;
          background-color: hsl(var(--primary));
          animation: vp-shimmer 1.8s ease-in-out infinite;
        }

        /* Label inferior */
        .vp-bottom-label {
          position: absolute;
          bottom: 1.75rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.675rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          white-space: nowrap;
        }

        /* Keyframes */
        @keyframes vp-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes vp-shimmer {
          0% {
            transform: translateX(-150%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        /* Reduced motion — respeta tanto OS como tu clase .reduce-motion */
        @media (prefers-reduced-motion: reduce) {
          .vp-ring,
          .vp-prog {
            animation: none;
          }
        }
      `}</style>
    </motion.div>
  )
}