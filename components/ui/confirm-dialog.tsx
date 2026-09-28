"use client"

import * as React from "react"
import { BadgeCheck, CircleHelp, Info, OctagonAlert, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalFooter, ResponsiveShell, type ModalSize } from "@/components/ui/responsive-shell"
import { cn } from "@/lib/utils"

export type ConfirmTone = "default" | "destructive" | "warning" | "info" | "success"

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  size?: ModalSize
  tone?: ConfirmTone
  icon?: React.ReactNode
  requireInputText?: string
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  resolve?: (value: boolean) => void
}

type Listener = (state: ConfirmState) => void
const listeners = new Set<Listener>()
let currentState: ConfirmState = { open: false, title: "" }

function setState(next: ConfirmState) {
  currentState = next
  listeners.forEach(listener => listener(next))
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => setState({ ...options, open: true, resolve }))
}

const TONE_STYLES: Record<ConfirmTone, { container: string; icon: React.ReactNode }> = {
  default: { container: "bg-primary/10 text-primary", icon: <CircleHelp aria-hidden="true" /> },
  destructive: { container: "bg-destructive/10 text-destructive", icon: <Trash2 aria-hidden="true" /> },
  warning: { container: "bg-warning/10 text-warning", icon: <OctagonAlert aria-hidden="true" /> },
  info: { container: "bg-info/10 text-info", icon: <Info aria-hidden="true" /> },
  success: { container: "bg-success/10 text-success", icon: <BadgeCheck aria-hidden="true" /> },
}

interface ConfirmationDialogProps extends ConfirmOptions {
  open: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({
  open, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  size = "xs", tone = "default", icon, requireInputText, inputValue,
  onInputChange, onCancel, onConfirm,
}: ConfirmationDialogProps) {
  const styles = TONE_STYLES[tone]
  const confirmDisabled = Boolean(requireInputText && inputValue !== requireInputText)
  const confirmVariant = tone === "destructive" ? "destructive" : tone === "warning" ? "warning" : "primary"

  return (
    <ResponsiveShell
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size={size}
      contentClassName="border-border"
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md border border-current/15 bg-card [&_svg]:size-4", styles.container)}>
            {icon ?? styles.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p aria-hidden="true" className="text-base font-semibold leading-6 tracking-tight text-foreground">{title}</p>
            {description && <p aria-hidden="true" className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {requireInputText && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-required-text" className="text-sm font-medium text-foreground">
              Escribe <span className="font-mono text-xs font-medium">{requireInputText}</span>
            </Label>
            <Input
              id="confirm-required-text"
              value={inputValue}
              onChange={event => onInputChange(event.target.value)}
              placeholder={requireInputText}
              autoComplete="off"
              className="h-11 bg-card"
            />
          </div>
        )}
      </div>
      <ModalFooter
        className="bg-muted/30 [&_button]:min-h-11 [&_button]:whitespace-nowrap"
        onCancel={onCancel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        confirmDisabled={confirmDisabled}
        confirmVariant={confirmVariant}
      />
    </ResponsiveShell>
  )
}

export function ConfirmProvider() {
  const [state, setLocalState] = React.useState<ConfirmState>(currentState)
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    const listener: Listener = next => {
      setLocalState(next)
      setInputValue("")
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const close = React.useCallback((value: boolean) => {
    state.resolve?.(value)
    setState({ ...currentState, open: false, resolve: undefined })
  }, [state])

  return (
    <ConfirmationDialog
      {...state}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  )
}
