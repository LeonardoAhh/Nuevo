"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"
import { useTheme } from "@/components/theme-context"

export function SonnerProvider() {
  const { resolvedTheme } = useTheme()
  // Dev-only handle: lets you trigger toasts from the browser console
  // (window.__toast.success(...)) to verify styles per variant.
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as { __toast: typeof toast }).__toast = toast
    }
  }, [])

  return (
    <Toaster
      theme={resolvedTheme}
      closeButton
      expand={false}
      visibleToasts={1}
      position="bottom-right"
      offset={16}
      mobileOffset={16}
      gap={12}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "app-toast",
          success: "app-toast--success",
          error: "app-toast--error",
          warning: "app-toast--warning",
          info: "app-toast--info",
        },
      }}
    />
  )
}
