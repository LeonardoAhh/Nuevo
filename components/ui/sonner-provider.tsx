"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"
import { useMobileNoticePlacement } from "@/lib/hooks/useMobileNoticePlacement"

const noticeOffset = {
  top: "calc(env(safe-area-inset-top, 0px) + var(--notice-edge))",
  right: "var(--notice-edge)",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--notice-edge))",
  left: "var(--notice-edge)",
}

export function SonnerProvider() {
  const isMobile = useMobileNoticePlacement()
  // Dev-only handle: lets you trigger toasts from the browser console
  // (window.__toast.success(...)) to verify styles per variant.
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as { __toast: typeof toast }).__toast = toast
    }
  }, [])

  return (
    <Toaster
      theme="light"
      closeButton
      expand={false}
      visibleToasts={1}
      position={isMobile ? "top-center" : "bottom-right"}
      offset={noticeOffset}
      mobileOffset={noticeOffset}
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
