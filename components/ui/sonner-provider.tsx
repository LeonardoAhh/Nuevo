"use client"

import { Toaster } from "sonner"

// position="bottom-right" en desktop: no interfiere con modales centrados.
// theme="system" deja que Sonner lea la clase "dark" del <html>,
// que el script inline de layout.tsx ya aplica antes de hidratación (sin FOUC).

export function SonnerProvider() {
  return (
    <Toaster
      theme="system"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      position="bottom-right"
      offset={16}
      gap={8}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: [
            "group flex items-start gap-3",
            "rounded-xl border border-border/60",
            "bg-card/95 backdrop-blur-sm",
            "text-foreground shadow-lg shadow-black/10",
            "px-4 py-3",
          ].join(" "),
          title: "text-sm font-semibold leading-snug",
          description: "text-xs text-muted-foreground leading-relaxed mt-0.5",
          icon: "mt-0.5 shrink-0",
          actionButton: [
            "ml-auto shrink-0",
            "rounded-lg bg-primary px-3 py-1.5",
            "text-xs font-semibold text-primary-foreground",
            "transition-opacity hover:opacity-90",
          ].join(" "),
          cancelButton: [
            "rounded-lg bg-muted px-3 py-1.5",
            "text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-muted/80",
          ].join(" "),
          closeButton: [
            "rounded-md border border-border/50",
            "bg-background text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
          ].join(" "),
          error:   "border-destructive/20",
          success: "border-green-500/20",
          warning: "border-amber-500/20",
          info:    "border-blue-500/20",
        },
      }}
    />
  )
}
