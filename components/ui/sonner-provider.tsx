"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"

// position="bottom-right" en desktop (no interfiere con modales centrados);
// en móvil el ancho lo controla --width en globals.css (@layer components)
// junto con mobileOffset, logrando el comportamiento full-width.
// theme="system" deja que Sonner lea la clase "dark" del <html>,
// que el script inline de layout.tsx ya aplica antes de hidratación (sin FOUC).

export function SonnerProvider() {
  // Dev-only handle: lets you trigger toasts from the browser console
  // (window.__toast.success(...)) to verify styles per variant.
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as { __toast: typeof toast }).__toast = toast
    }
  }, [])

  return (
    <Toaster
      theme="system"
      closeButton
      expand={false}
      visibleToasts={3}
      position="bottom-right"
      offset={16}
      mobileOffset={16}
      gap={12}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: [
            "group flex w-full items-start gap-3.5",
            "rounded-md border border-border",
            "bg-card text-card-foreground",
            "shadow-[0_2px_2px_hsl(0_0%_0%/0.04),0_8px_16px_-4px_hsl(0_0%_0%/0.10)]",
            "px-4 py-3.5 transition-colors",
          ].join(" "),
          title: "text-sm font-semibold tracking-tight text-foreground",
          description: "text-xs text-muted-foreground leading-relaxed mt-0.5",
          icon: "mt-0.5 shrink-0 [&>svg]:w-5 [&>svg]:h-5",
          actionButton: [
            "ml-auto shrink-0",
            "rounded-md bg-primary px-3 py-1.5",
            "text-xs font-semibold text-primary-foreground",
            "transition-opacity hover:opacity-90",
          ].join(" "),
          cancelButton: [
            "rounded-md bg-muted px-3 py-1.5",
            "text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-muted/80",
          ].join(" "),
          closeButton: [
            "rounded-md border border-border",
            "bg-card text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
          ].join(" "),
          // Semantic color stays on the hairline and icon; the notification
          // surface remains neutral to avoid large saturated blocks.
          success:
            "!bg-card !text-card-foreground !border-success/40 [&>[data-icon]]:text-success [&_[data-description]]:!text-muted-foreground",
          error:
            "!bg-card !text-card-foreground !border-destructive/40 [&>[data-icon]]:text-destructive [&_[data-description]]:!text-muted-foreground",
          warning:
            "!bg-card !text-card-foreground !border-warning/50 [&>[data-icon]]:text-warning [&_[data-description]]:!text-muted-foreground",
          info:
            "!bg-card !text-card-foreground !border-info/40 [&>[data-icon]]:text-info [&_[data-description]]:!text-muted-foreground",
        },
      }}
    />
  )
}
