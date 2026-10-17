"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { CircleCheck, Download, LoaderCircle } from "lucide"
import { MorphIcon } from "morphicons/react"
import { Button } from "@/components/ui/button"
import { APP_UPDATE_COMPLETED_KEY, useAppUpdate } from "@/lib/hooks/useAppUpdate"
import { useMobileNoticePlacement } from "@/lib/hooks/useMobileNoticePlacement"
import { useEffect, useState } from "react"

type BannerPreview = "available" | "applying" | "updated" | null

type BannerPreviewWindow = Window & {
  __previewUpdateBanner?: () => void
  __hideUpdateBanner?: () => void
}

export function UpdateBanner() {
  const { status, applyUpdate } = useAppUpdate()
  const [preview, setPreview] = useState<BannerPreview>(null)
  const [completed, setCompleted] = useState(false)
  const reduced = useReducedMotion()
  const isMobile = useMobileNoticePlacement()

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    const previewWindow = window as BannerPreviewWindow
    previewWindow.__previewUpdateBanner = () => {
      setPreview("available")
    }
    previewWindow.__hideUpdateBanner = () => setPreview(null)

    return () => {
      delete previewWindow.__previewUpdateBanner
      delete previewWindow.__hideUpdateBanner
    }
  }, [])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(APP_UPDATE_COMPLETED_KEY) !== "1") return
      sessionStorage.removeItem(APP_UPDATE_COMPLETED_KEY)
      setCompleted(true)
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }, [])

  useEffect(() => {
    if (!completed) return
    const timer = setTimeout(() => setCompleted(false), 4000)
    return () => clearTimeout(timer)
  }, [completed])

  useEffect(() => {
    if (preview === null || preview === "available") return
    const timer = setTimeout(() => setPreview(preview === "applying" ? "updated" : null), preview === "applying" ? 700 : 4000)
    return () => clearTimeout(timer)
  }, [preview])

  const applying = preview === "applying" || (preview === null && status === "applying")
  const updated = preview === "updated" || (preview === null && completed)
  const visible = preview !== null || completed || status === "available" || applying
  const label = updated ? "Actualizado" : applying ? "Actualizando" : "Actualizar"

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
          initial={reduced ? false : { opacity: 0, y: isMobile ? -16 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isMobile ? -16 : 16 }}
          transition={{ duration: 0.2 }}
          className="app-update-banner"
        >
          <div className="ui-floating-surface p-1">
            <span className="sr-only" role="status" aria-live="polite">
              {updated ? "Aplicación actualizada" : applying ? "Actualizando aplicación" : "Nueva versión disponible"}
            </span>
            <Button
              type="button"
              size="sm"
              className="min-h-11 gap-2 px-3 disabled:opacity-100"
              onClick={handleUpdate}
              disabled={applying || updated}
              aria-busy={applying}
            >
              <MorphIcon
                icon={updated ? CircleCheck : applying ? LoaderCircle : Download}
                spring="snappy"
                reducedMotion="user"
                strokeWidth={2}
                className={applying && !reduced ? "animate-spin" : undefined}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={label}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
