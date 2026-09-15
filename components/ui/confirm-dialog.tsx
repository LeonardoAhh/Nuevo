"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalFooter, ResponsiveShell } from "@/components/ui/responsive-shell"
import { cn } from "@/lib/utils"

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
  default: { container: "bg-primary/10 text-primary", icon: <Info aria-hidden="true" /> },
  destructive: { container: "bg-destructive/10 text-destructive", icon: <Trash2 aria-hidden="true" /> },
  warning: { container: "bg-warning/10 text-warning", icon: <AlertTriangle aria-hidden="true" /> },
  info: { container: "bg-info/10 text-info", icon: <Info aria-hidden="true" /> },
  success: { container: "bg-success/10 text-success", icon: <CheckCircle2 aria-hidden="true" /> },
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

  const tone = state.tone ?? "default"
  const styles = TONE_STYLES[tone]
  const confirmDisabled = Boolean(state.requireInputText && inputValue !== state.requireInputText)
  const confirmVariant = tone === "destructive" ? "destructive" : tone === "warning" ? "warning" : "primary"

  return <ResponsiveShell
    open={state.open}
    onClose={() => close(false)}
    title={state.title || "Confirmación"}
    description={state.description}
    maxWidth="sm:max-w-md"
  >
    <div className="flex items-start gap-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-5", styles.container)}>
        {state.icon ?? styles.icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="text-base font-semibold leading-snug text-foreground">{state.title}</h2>
        {state.description && <p className="text-sm leading-relaxed text-muted-foreground">{state.description}</p>}
        {state.requireInputText && <div className="space-y-2 pt-3">
          <Label htmlFor="confirm-required-text">Escribe <strong>{state.requireInputText}</strong> para confirmar</Label>
          <Input id="confirm-required-text" value={inputValue} onChange={event => setInputValue(event.target.value)} placeholder={state.requireInputText} autoComplete="off" />
        </div>}
      </div>
    </div>
    <ModalFooter
      className="[&_button]:min-h-11 [&_button]:whitespace-nowrap"
      onCancel={() => close(false)}
      cancelLabel={state.cancelLabel ?? "Cancelar"}
      onConfirm={() => close(true)}
      confirmLabel={state.confirmLabel ?? "Confirmar"}
      confirmDisabled={confirmDisabled}
      confirmVariant={confirmVariant}
    />
  </ResponsiveShell>
}
