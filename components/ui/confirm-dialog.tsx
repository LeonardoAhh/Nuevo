"use client"

import * as React from "react"
import { AlertTriangle, Trash2, Info, CheckCircle2, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/responsive-shell"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ConfirmTone = "default" | "destructive" | "warning" | "info" | "success"

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: React.ReactNode
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  resolve?: (value: boolean) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton store (module-level) so notify.confirm() works without hooks
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (state: ConfirmState) => void
const listeners = new Set<Listener>()
let currentState: ConfirmState = { open: false, title: "" }

function setState(next: ConfirmState) {
  currentState = next
  listeners.forEach((l) => l(next))
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setState({ ...options, open: true, resolve })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tone tokens (semantic only, no hardcoded colors)
// ─────────────────────────────────────────────────────────────────────────────

const TONE_STYLES: Record<ConfirmTone, { bg: string; fg: string; btn: string; icon: React.ReactNode }> = {
  default: {
    bg: "bg-primary/10",
    fg: "text-primary",
    btn: "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90",
    icon: <Info className="h-6 w-6" />,
  },
  destructive: {
    bg: "bg-destructive/10",
    fg: "text-destructive",
    btn: "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30 hover:bg-destructive/90",
    icon: <Trash2 className="h-6 w-6" />,
  },
  warning: {
    bg: "bg-warning/10",
    fg: "text-warning",
    btn: "bg-warning text-warning-foreground shadow-md shadow-warning/30 hover:bg-warning/90",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  info: {
    bg: "bg-info/10",
    fg: "text-info",
    btn: "bg-info text-info-foreground shadow-md shadow-info/30 hover:bg-info/90",
    icon: <Info className="h-6 w-6" />,
  },
  success: {
    bg: "bg-success/10",
    fg: "text-success",
    btn: "bg-success text-success-foreground shadow-md shadow-success/30 hover:bg-success/90",
    icon: <CheckCircle2 className="h-6 w-6" />,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Top toolbar (buttons on top, per design request)
// ─────────────────────────────────────────────────────────────────────────────

interface ToolbarProps {
  tone: ConfirmTone
  confirmLabel: string
  cancelLabel: string
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmToolbar({ tone, confirmLabel, cancelLabel, onCancel, onConfirm }: ToolbarProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={cancelLabel}
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">{cancelLabel}</span>
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          styles.btn,
        )}
        autoFocus
      >
        <Check className="h-4 w-4" />
        <span>{confirmLabel}</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Body
// ─────────────────────────────────────────────────────────────────────────────

interface BodyProps {
  tone: ConfirmTone
  title: string
  description?: string
  icon?: React.ReactNode
  TitleEl: React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  DescriptionEl: React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
}

function ConfirmBody({ tone, title, description, icon, TitleEl, DescriptionEl }: BodyProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", styles.bg, styles.fg)}>
        {icon ?? styles.icon}
      </div>
      <TitleEl className="text-base font-semibold leading-tight text-foreground">{title}</TitleEl>
      {description ? (
        <DescriptionEl className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</DescriptionEl>
      ) : null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider — mount once in root layout
// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmProvider() {
  const [state, setLocalState] = React.useState<ConfirmState>(currentState)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const listener: Listener = (s) => setLocalState(s)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const close = React.useCallback((value: boolean) => {
    state.resolve?.(value)
    setState({ ...currentState, open: false, resolve: undefined })
  }, [state])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) close(false)
  }, [close])

  const tone = state.tone ?? "default"
  const confirmLabel = state.confirmLabel ?? "Confirmar"
  const cancelLabel = state.cancelLabel ?? "Cancelar"

  if (isMobile) {
    return (
      <Drawer open={state.open} onOpenChange={handleOpenChange}>
        <DrawerContent className="border-border bg-card p-0">
          <ConfirmToolbar
            tone={tone}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
          />
          <ConfirmBody
            tone={tone}
            title={state.title}
            description={state.description}
            icon={state.icon}
            TitleEl={DrawerTitle as React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>}
            DescriptionEl={DrawerDescription as React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>}
          />
          <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden border-border bg-card p-0"
        onEscapeKeyDown={() => close(false)}
      >
        <ConfirmToolbar
          tone={tone}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
        />
        <ConfirmBody
          tone={tone}
          title={state.title}
          description={state.description}
          icon={state.icon}
          TitleEl={DialogTitle as React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>}
          DescriptionEl={DialogDescription as React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>}
        />
      </DialogContent>
    </Dialog>
  )
}
