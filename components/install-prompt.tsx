"use client"

import { useEffect, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download, EyeOff, Share, Smartphone, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

const DISMISS_KEY = "pwa-install-dismissed-at"
const SHOW_AFTER_MS = 15_000 // don't nag the user on first paint
const REPROMPT_AFTER_DAYS = 7

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true
  // iOS Safari
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true
  return false
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  // iPhone / iPad / iPod — also iPadOS masquerading as Mac with touch
  return /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)
}

function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return true
  const raw = window.localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const at = parseInt(raw, 10)
  if (Number.isNaN(at)) return false
  const elapsedDays = (Date.now() - at) / (1000 * 60 * 60 * 24)
  return elapsedDays < REPROMPT_AFTER_DAYS
}

/**
 * Redesigned PWA install invitation.
 *
 *  - Android / Chromium: listens for `beforeinstallprompt`, shows a single
 *    "Instalar" CTA that triggers the native prompt.
 *  - iOS Safari: no programmatic prompt exists, so we show a concise
 *    instructions sheet ("Compartir → Agregar a la pantalla de inicio").
 *  - Hidden entirely if the app is already installed (display-mode:
 *    standalone or `navigator.standalone`).
 *  - Dismissing stores a timestamp in localStorage; we don't re-prompt for
 *    7 days. "Instalar" also dismisses permanently on success.
 */
export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosSheetOpen, setIosSheetOpen] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    const ios = isIOS()
    setIsIos(ios)

    // Delay so we don't nag users on first paint.
    const showTimer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Beforeinstallprompt beats the timer: show immediately once we have it
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setPrompt(null)
      window.localStorage.removeItem(DISMISS_KEY)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      clearTimeout(showTimer)
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setIosSheetOpen(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* no-op */
    }
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === "accepted") {
        setVisible(false)
      } else {
        dismiss()
      }
    } catch {
      dismiss()
    } finally {
      setPrompt(null)
    }
  }, [prompt, dismiss])

  // Nothing to show if we have neither a native prompt nor an iOS user.
  const canShow = visible && (prompt !== null || isIos)

  return (
    <AnimatePresence>
      {canShow ? (
        <>
          <motion.div
            role="dialog"
            aria-label="Instalar aplicación"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),1rem)] z-[55] flex justify-center px-4"
          >
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-3 pl-4 shadow-xl backdrop-blur">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
                <Smartphone className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">Instalar la app</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isIos ? "Agrégala a tu pantalla de inicio" : "Acceso rápido y notificaciones"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  onClick={() => (isIos ? setIosSheetOpen(true) : install())}
                  aria-label="Instalar"
                  title="Instalar"
                >
                  <Download className="size-3.5" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Cerrar"
                  onClick={dismiss}
                  className="size-9"
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {iosSheetOpen ? (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Cómo instalar en iOS"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-end justify-center bg-background/60 backdrop-blur-sm sm:items-center"
                onClick={() => setIosSheetOpen(false)}
              >
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-md rounded-t-2xl border border-border/60 bg-card p-6 shadow-2xl sm:rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Instalar en iPhone / iPad</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Dos pasos en Safari.</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Cerrar"
                      onClick={() => setIosSheetOpen(false)}
                      className="size-9 shrink-0"
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </div>
                  <ol className="mt-5 space-y-4 text-sm">
                    <li className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">1</span>
                      <span className="flex-1 text-foreground">Toca el botón</span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/60 px-2 py-1 text-xs font-medium">
                        <Share className="size-3.5" aria-hidden /> Compartir
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">2</span>
                      <span className="flex-1 text-foreground">Elige</span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/60 px-2 py-1 text-xs font-medium">
                        <Plus className="size-3.5" aria-hidden /> Agregar al inicio
                      </span>
                    </li>
                  </ol>
                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" size="icon" onClick={dismiss} aria-label="No volver a mostrar" title="No volver a mostrar">
                      <EyeOff className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </AnimatePresence>
  )
}
