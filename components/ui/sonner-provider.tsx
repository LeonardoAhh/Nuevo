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
            "bg-card text-card-foreground shadow-lg",
            "px-4 py-3.5 transition-all",
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
          // Variantes semánticas: fondo sólido del token + foreground del token.
          // El prefijo ! sobrescribe los estilos inline de Sonner (requisito de
          // su API, no un hack). La descripción hereda el foreground del token
          // vía [data-description] para mantener contraste AA.
          success:
            "!bg-success !text-success-foreground !border-success/60 [&>[data-icon]]:text-success-foreground [&_[data-description]]:!text-success-foreground/80",
          error:
            "!bg-destructive !text-destructive-foreground !border-destructive/60 [&>[data-icon]]:text-destructive-foreground [&_[data-description]]:!text-destructive-foreground/80",
          warning:
            "!bg-warning !text-warning-foreground !border-warning/60 [&>[data-icon]]:text-warning-foreground [&_[data-description]]:!text-warning-foreground/80",
          info:
            "!bg-info !text-info-foreground !border-info/60 [&>[data-icon]]:text-info-foreground [&_[data-description]]:!text-info-foreground/80",
        },
      }}
    />
  )
}
