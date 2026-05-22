"use client"
import { Toaster } from "sonner"

export function SonnerProvider() {
  return (
    <Toaster
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      position="top-center"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-card text-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold",
          cancelButton:
            "bg-muted text-foreground rounded-full px-3 py-1 text-xs font-medium",
          closeButton: "border border-border bg-background text-muted-foreground",
        },
      }}
    />
  )
}
