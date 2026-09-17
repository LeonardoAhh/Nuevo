"use client"

import React, { useCallback, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile
// ─────────────────────────────────────────────────────────────────────────────

export function useIsMobile(breakpoint = 639) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    mq.addEventListener("change", onStoreChange)
    return () => mq.removeEventListener("change", onStoreChange)
  }, [breakpoint])

  const getSnapshot = useCallback(
    () => window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
    [breakpoint]
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalHeader / ModalFooter
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose?: () => void
}

export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <DialogHeader className="sticky top-0 z-10 mb-0 flex-row items-center justify-between gap-4 border-b bg-card px-4 py-3 pr-4 text-left sm:px-6 sm:py-4 sm:pr-6">
      <div className="flex-1 min-w-0">
        <h2 className="break-words text-lg font-semibold leading-tight tracking-tight text-foreground">{title}</h2>
        {subtitle && (
          <p className="sr-only">{subtitle}</p>
        )}
      </div>
      {onClose && (
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Cerrar modal">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
      )}
    </DialogHeader>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalFooter — action buttons at the bottom
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalSecondaryAction {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'secondary' | 'outline' | 'ghost'
}

export interface ModalFooterProps {
  className?: string
  onCancel?: () => void
  cancelLabel?: string
  cancelDisabled?: boolean
  onConfirm?: () => void
  confirmLabel?: string
  confirmIcon?: React.ReactNode
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'destructive' | 'warning'
  saving?: boolean
  secondaryAction?: ModalSecondaryAction
}

export function ModalFooter({
  className,
  onCancel,
  cancelLabel = "Cancelar",
  cancelDisabled,
  onConfirm,
  confirmLabel = "Guardar",
  confirmIcon,
  confirmDisabled,
  confirmVariant = 'primary',
  saving,
  secondaryAction,
}: ModalFooterProps) {
  const confirmClasses = confirmVariant === 'destructive'
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : confirmVariant === 'warning'
      ? "bg-warning text-warning-foreground hover:bg-warning/90"
      : "bg-primary text-primary-foreground hover:bg-primary/90"

  const secondaryClasses = secondaryAction?.variant === 'outline'
    ? "border border-input bg-card hover:bg-accent hover:text-accent-foreground"
    : secondaryAction?.variant === 'ghost'
    ? "hover:bg-accent hover:text-accent-foreground"
    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"

  return (
    <DialogFooter detached className={cn("mt-auto shrink-0 items-stretch border-t bg-card px-4 py-3 sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4", className)}>
      <div className="sm:flex-1">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={saving || secondaryAction.disabled}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:w-auto",
              secondaryClasses
            )}
          >
            {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || cancelDisabled}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || confirmDisabled}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              confirmClasses
            )}
          >
            {saving ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : confirmIcon ? (
              <span className="mr-2">{confirmIcon}</span>
            ) : null}
            {confirmLabel}
          </button>
        )}
      </div>
    </DialogFooter>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveShell — shared centered Dialog on every screen
// ─────────────────────────────────────────────────────────────────────────────

export interface ResponsiveShellProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  contentClassName?: string
  /** @deprecated Modals now use the same centered Dialog on every screen. */
  mobileVariant?: 'drawer' | 'dialog'
  title: string
  description?: string
}

export function ResponsiveShell({
  open, onClose, children, maxWidth = "sm:max-w-lg", contentClassName, title, description,
}: ResponsiveShellProps) {
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose() }}>
      <DialogContent
        raw
        onOpenAutoFocus={event => {
          previousFocus.current = document.activeElement as HTMLElement | null
          event.preventDefault()
          titleRef.current?.focus()
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          previousFocus.current?.focus()
        }}
        className={cn(maxWidth, "p-0 gap-0", contentClassName)}
      >
        <DialogTitle ref={titleRef} tabIndex={-1} className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description ?? title}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}
