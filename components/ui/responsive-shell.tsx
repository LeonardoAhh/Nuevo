"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"

// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile
// ─────────────────────────────────────────────────────────────────────────────

export function useIsMobile(breakpoint = 639) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [breakpoint])
  return isMobile
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalHeader / ModalFooter
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose?: () => void
}

export function ModalHeader({ title, subtitle }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-background sticky top-0 z-10 shrink-0">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold leading-tight text-foreground truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate mt-1">{subtitle}</p>
        )}
      </div>
    </div>
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
  onCancel?: () => void
  cancelLabel?: string
  cancelDisabled?: boolean
  onConfirm?: () => void
  confirmLabel?: string
  confirmIcon?: React.ReactNode
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'destructive'
  saving?: boolean
  secondaryAction?: ModalSecondaryAction
}

export function ModalFooter({
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
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/30"
    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/30"

  const secondaryClasses = secondaryAction?.variant === 'outline'
    ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    : secondaryAction?.variant === 'ghost'
    ? "hover:bg-accent hover:text-accent-foreground"
    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-background shrink-0 mt-auto">
      <div className="flex-1">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={saving || secondaryAction.disabled}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              secondaryClasses
            )}
          >
            {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || cancelDisabled}
            className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
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
              "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm",
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveShell — Drawer on mobile, Dialog on desktop
// ─────────────────────────────────────────────────────────────────────────────

export interface ResponsiveShellProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  title: string
  description?: string
}

export function ResponsiveShell({
  open, onClose, children, maxWidth = "sm:max-w-lg", title, description,
}: ResponsiveShellProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent raw className={cn("max-h-[92dvh] flex flex-col outline-none bg-card !overflow-hidden")}>
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description ?? title}</DrawerDescription>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        raw
        aria-describedby={description ? "shell-desc" : undefined}
        className={cn(maxWidth, "flex flex-col overflow-hidden p-0 gap-0 [&>button.absolute]:hidden")}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription id="shell-desc">{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
