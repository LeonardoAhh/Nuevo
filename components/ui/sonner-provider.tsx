"use client"

import { Toaster } from "sonner"

// position="bottom-right" en desktop: no interfiere con modales centrados.
// theme="system" deja que Sonner lea la clase "dark" del <html>,
// que el script inline de layout.tsx ya aplica antes de hidratación (sin FOUC).

export function SonnerProvider() {
  return (
    <Toaster
      theme="system"
      closeButton
      expand={false}
      visibleToasts={3}
      position="bottom-right"
      offset={24}
      gap={12}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: [
            "group flex w-full items-start gap-3.5",
            "rounded-2xl border border-border/50",
            "bg-background/80 backdrop-blur-xl",
            "text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]",
            "px-5 py-4 transition-all duration-300",
          ].join(" "),
          title: "text-sm font-semibold tracking-tight",
          description: "text-[13px] text-muted-foreground leading-relaxed mt-0.5",
          icon: "mt-0.5 shrink-0 [&>svg]:w-5 [&>svg]:h-5",
          actionButton: [
            "ml-auto shrink-0",
            "rounded-lg bg-primary px-3.5 py-1.5",
            "text-xs font-semibold text-primary-foreground",
            "transition-opacity hover:opacity-90",
          ].join(" "),
          cancelButton: [
            "rounded-lg bg-muted px-3.5 py-1.5",
            "text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-muted/80",
          ].join(" "),
          closeButton: [
            "rounded-full border border-border/50",
            "bg-background/50 backdrop-blur-md text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
          ].join(" "),
          success: "!bg-green-50/80 dark:!bg-green-900/20 !border-green-500/30 [&>[data-icon]]:text-green-600 dark:[&>[data-icon]]:text-green-400",
          error: "!bg-red-50/80 dark:!bg-red-900/20 !border-red-500/30 [&>[data-icon]]:text-red-600 dark:[&>[data-icon]]:text-red-400",
          warning: "!bg-amber-50/80 dark:!bg-amber-900/20 !border-amber-500/30 [&>[data-icon]]:text-amber-600 dark:[&>[data-icon]]:text-amber-400",
          info: "!bg-blue-50/80 dark:!bg-blue-900/20 !border-blue-500/30 [&>[data-icon]]:text-blue-600 dark:[&>[data-icon]]:text-blue-400",
        },
      }}
    />
  )
}
