"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Download, Loader2, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppUpdate } from "@/lib/hooks/useAppUpdate"
import { useEffect, useState } from "react"

type BannerPreview = "available" | "applying" | null

type BannerPreviewWindow = Window & {
  __previewUpdateBanner?: () => void
  __hideUpdateBanner?: () => void
}

export function UpdateBanner() {
  const { status, applyUpdate } = useAppUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [preview, setPreview] = useState<BannerPreview>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    const previewWindow = window as BannerPreviewWindow
    previewWindow.__previewUpdateBanner = () => {
      setDismissed(false)
      setPreview("available")
    }
    previewWindow.__hideUpdateBanner = () => setPreview(null)

    return () => {
      delete previewWindow.__previewUpdateBanner
      delete previewWindow.__hideUpdateBanner
    }
  }, [])

  const applying = preview === "applying" || (preview === null && status === "applying")
  const visible = (preview !== null || status === "available" || applying) && !dismissed

  const handleUpdate = () => {
    if (preview !== null) {
      setPreview("applying")
      return
    }
    applyUpdate()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-4 top-[calc(var(--workspace-header-height)+1rem)] z-50 sm:inset-x-auto sm:right-6 sm:w-[var(--notice-width)]"
        >
          <div className="ui-floating-surface relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 p-3 pr-12">
            <div className="col-span-2 flex min-w-0 items-center gap-2">
              <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="min-w-0 truncate text-sm font-semibold leading-5 text-foreground">
                {applying ? "Actualizando…" : "Actualización disponible"}
              </p>
            </div>

            <p className="min-w-0 truncate text-xs leading-4 text-muted-foreground">
              {applying ? "Recargando…" : "Lista para instalar."}
            </p>

            <Button type="button" size="sm" onClick={handleUpdate} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Actualizando…
                </>
              ) : (
                <>
                  <RefreshCw aria-hidden="true" />
                  Actualizar
                </>
              )}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              disabled={applying}
              className="absolute right-1 top-1 size-10 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar aviso de actualización"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
