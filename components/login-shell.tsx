"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import { motion, useReducedMotion } from "framer-motion"
import LoginForm from "@/components/login-form"
import LoginHeroVideo from "@/components/login-hero-video"

export default function LoginShell() {
  const [documentReady, setDocumentReady] = useState(false)
  const [minimumReady, setMinimumReady] = useState(false)
  const prefersReducedMotion = useReducedMotion() ?? false

  useEffect(() => {
    if (document.readyState === "complete") {
      setDocumentReady(true)
      return
    }

    const onLoad = () => setDocumentReady(true)
    window.addEventListener("load", onLoad, { once: true })
    return () => window.removeEventListener("load", onLoad)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumReady(true), 420)
    return () => window.clearTimeout(timer)
  }, [])

  const isReady = documentReady && minimumReady

  return (
    <div className="relative login-page min-h-[100dvh] flex flex-col lg:flex-row bg-background text-foreground">
      <div className="login-hero-panel relative flex-shrink-0 lg:w-[55%] xl:w-[58%] h-[48dvh] sm:h-[52dvh] lg:h-auto lg:min-h-[100dvh]">
        <LoginHeroVideo />
      </div>

      <div className="relative z-10 -mt-10 lg:mt-0 flex flex-1 items-start lg:items-center justify-center px-4 pt-2 sm:px-8 lg:px-12 xl:px-20 bg-background rounded-t-3xl lg:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:shadow-none safe-bottom-content">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-96" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <motion.div
        aria-live="polite"
        aria-busy={!isReady}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: isReady ? 0 : 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: "linear" }}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-muted/40 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Cargando...</p>
        </div>
      </motion.div>
    </div>
  )
}
