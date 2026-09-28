"use client"

import type { LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Shared surface for full-screen status pages (error boundary, maintenance).
 *
 * Design system contract:
 * - Flat hairline card on the neutral canvas.
 * - Compact icon tile tinted only by semantic tone.
 * - Mono uppercase eyebrow + Geist Sans heading.
 * - Tokens only: accent color, density spacing and reduced-motion settings
 *   apply automatically. No pill/full-rounded shapes.
 */

const EASE = [0.16, 1, 0.3, 1] as const

export type StatusTone = "primary" | "destructive"

const TONE: Record<StatusTone, { tile: string }> = {
  primary: {
    tile: "border-primary/25 bg-primary/10 text-primary",
  },
  destructive: {
    tile: "border-destructive/25 bg-destructive/10 text-destructive",
  },
}

interface StatusShellProps {
  icon: LucideIcon
  tone?: StatusTone
  /** Small mono uppercase label above the heading. */
  eyebrow: string
  title: string
  description: string
  /** Accessible name for the <main> landmark (id of the heading). */
  labelledBy: string
  /** Card body content rendered after the description. */
  children?: React.ReactNode
  /** Optional strip pinned to the bottom of the card. */
  footer?: React.ReactNode
}

export function StatusShell({
  icon: Icon,
  tone = "primary",
  eyebrow,
  title,
  description,
  labelledBy,
  children,
  footer,
}: StatusShellProps) {
  const reduced = useReducedMotion()
  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: EASE, delay },
        }

  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16"
      aria-labelledby={labelledBy}
    >
      <motion.section {...fade(0)} className="relative z-10 w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-7 sm:p-10">
            {/* Header · icon tile + status eyebrow */}
            <motion.div {...fade(0.08)} className="mb-7 flex items-center gap-4">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-md border", TONE[tone].tile)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
                {eyebrow}
              </p>
            </motion.div>

            {/* Heading + description */}
            <motion.h1
              id={labelledBy}
              {...fade(0.14)}
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              {title}
            </motion.h1>
            <motion.p
              {...fade(0.2)}
              className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {description}
            </motion.p>

            {children}
          </div>

          {footer && (
            <motion.div
              {...fade(0.34)}
              className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </motion.section>
    </main>
  )
}

/** Small mono caption used under the card / in footer strips. */
export function StatusCaption({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-medium uppercase text-muted-foreground", className)}>
      {children}
    </p>
  )
}

/** Divider used between body content and actions. */
export function StatusDivider({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      {...(reduced ? {} : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.45, ease: EASE, delay },
      })}
      className="my-7 h-px bg-border"
      aria-hidden="true"
    />
  )
}
