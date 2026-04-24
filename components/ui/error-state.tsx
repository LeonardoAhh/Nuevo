"use client"

import type { LucideIcon } from "lucide-react"
import { AlertCircle, FileQuestion, Lock, WifiOff } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export type ErrorStateTone = "neutral" | "warning" | "destructive"

interface ErrorStateProps {
  icon?: LucideIcon
  code?: string
  title: string
  description?: string
  tone?: ErrorStateTone
  primaryAction?: { label: string; onClick: () => void; href?: string }
  secondaryAction?: { label: string; onClick: () => void; href?: string }
  className?: string
}

/**
 * Full-screen / full-panel empty-error layout used by the error, not-found,
 * global-error and permission-denied screens. Kept visually minimal and
 * token-driven so it blends in with the rest of the app.
 */
export function ErrorState({
  icon: Icon = AlertCircle,
  code,
  title,
  description,
  tone = "neutral",
  primaryAction,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const iconBg =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground"

  return (
    <div
      className={
        "mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center " +
        (className ?? "")
      }
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`grid size-16 place-items-center rounded-2xl ${iconBg}`}
        aria-hidden
      >
        <Icon className="size-7" strokeWidth={1.75} />
      </motion.div>

      <div className="space-y-2">
        {code ? (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{code}</p>
        ) : null}
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          {secondaryAction && (
            <Button
              variant="outline"
              size="default"
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? <a href={secondaryAction.href}>{secondaryAction.label}</a> : secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button size="default" onClick={primaryAction.onClick} asChild={!!primaryAction.href}>
              {primaryAction.href ? <a href={primaryAction.href}>{primaryAction.label}</a> : primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Re-export commonly used icons so callers don't need to import lucide separately
export { AlertCircle, FileQuestion, Lock, WifiOff }
