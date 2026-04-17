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
// ModalToolbar — pill icon-only buttons for close / confirm
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalToolbarSecondaryAction {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'secondary' | 'outline'
}

export interface ModalToolbarProps {
  title: string
  subtitle?: string
  saving: boolean
  onClose: () => void
  onConfirm?: () => void
  confirmIcon?: React.ReactNode
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'destructive'
  secondaryAction?: ModalToolbarSecondaryAction
}

export function ModalToolbar({
  title, subtitle, saving, onClose, onConfirm, confirmIcon, confirmDisabled, confirmVariant = 'primary', secondaryAction,
}: ModalToolbarProps) {
  const confirmClasses = confirmVariant === 'destructive'
    ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30"
    : "bg-primary text-primary-foreground shadow-md shadow-primary/30"

  const secondaryClasses = secondaryAction?.variant === 'outline'
    ? "bg-background border border-border text-foreground shadow-sm"
    : "bg-muted text-foreground border border-border/40 shadow-sm"

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card backdrop-blur-sm sticky top-0 z-10 shrink-0 rounded-t-xl">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.88 }}
        onClick={onClose}
        disabled={saving}
        className="h-9 w-9 rounded-full flex items-center justify-center bg-muted hover:bg-muted-foreground/15 border border-border/40 shadow-sm transition-colors shrink-0 disabled:opacity-50"
        aria-label="Cancelar"
      >
        <X className="h-4 w-4" />
      </motion.button>

      <div className="flex-1 text-center min-w-0 px-1">
        <p className="text-sm font-semibold leading-tight truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {secondaryAction && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={secondaryAction.onClick}
            disabled={saving || secondaryAction.disabled}
            className={cn("h-9 rounded-full px-3 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity", secondaryClasses)}
            aria-label={secondaryAction.label}
          >
            {secondaryAction.icon}
            <span className="hidden sm:inline">{secondaryAction.label}</span>
          </motion.button>
        )}

        {onConfirm ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.88 }}
            onClick={onConfirm}
            disabled={saving || confirmDisabled}
            className={cn("h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0", confirmClasses)}
            aria-label="Confirmar"
          >
            {saving
              ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : (confirmIcon ?? <Check className="h-4 w-4" />)}
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" />
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
        <DrawerContent className={cn("max-h-[92dvh] flex flex-col outline-none bg-card")}>
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description ?? title}</DrawerDescription>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent raw className={cn(maxWidth, "[&>button.absolute]:hidden")}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? title}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
