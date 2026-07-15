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
  requireInputText?: string
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
  confirmDisabled?: boolean
}

function ConfirmToolbar({ tone, confirmLabel, cancelLabel, onCancel, onConfirm, confirmDisabled }: ToolbarProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="flex items-center justify-center gap-3 px-6 pb-6 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm",
          styles.btn,
          confirmDisabled && "opacity-50 cursor-not-allowed"
        )}
        autoFocus
      >
        {confirmLabel}
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
  requireInputText?: string
  inputValue: string
  onInputChange: (v: string) => void
}

function ConfirmBody({ tone, title, description, icon, TitleEl, DescriptionEl, requireInputText, inputValue, onInputChange }: BodyProps) {
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
      {requireInputText ? (
        <div className="w-full mt-4 flex flex-col gap-2 text-left">
          <label className="text-sm font-medium text-foreground">
            Escribe <span className="font-bold select-all">{requireInputText}</span> para confirmar:
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={requireInputText}
          />
        </div>
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
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    const listener: Listener = (s) => {
      setLocalState(s)
      setInputValue("")
    }
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
  const confirmDisabled = state.requireInputText ? inputValue !== state.requireInputText : false

  if (isMobile) {
    return (
      <Drawer open={state.open} onOpenChange={handleOpenChange}>
        <DrawerContent className="border-border bg-card p-0">
          <ConfirmBody
            tone={tone}
            title={state.title}
            description={state.description}
            icon={state.icon}
            TitleEl={DrawerTitle as React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>}
            DescriptionEl={DrawerDescription as React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>}
            requireInputText={state.requireInputText}
            inputValue={inputValue}
            onInputChange={setInputValue}
          />
          <ConfirmToolbar
            tone={tone}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
            confirmDisabled={confirmDisabled}
          />
          <div className="safe-bottom" aria-hidden />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="max-w-sm gap-0 overflow-hidden border-border bg-card p-0"
        onEscapeKeyDown={() => close(false)}
      >
        <ConfirmBody
          tone={tone}
          title={state.title}
          description={state.description}
          icon={state.icon}
          TitleEl={DialogTitle as React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>}
          DescriptionEl={DialogDescription as React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>}
          requireInputText={state.requireInputText}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
        <ConfirmToolbar
          tone={tone}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          confirmDisabled={confirmDisabled}
        />
      </DialogContent>
    </Dialog>
  )
}
