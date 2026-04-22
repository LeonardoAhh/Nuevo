"use client"
import { Toaster } from "sonner"
import { useIsMobile } from "@/components/ui/responsive-shell"

export function SonnerProvider() {
  const isMobile = useIsMobile()
  return (
    <Toaster
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      position={isMobile ? "top-center" : "top-right"}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border bg-card text-foreground shadow-lg",
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
