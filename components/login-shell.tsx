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
    <div className="relative login-page min-h-[100dvh] flex flex-col lg:flex-row-reverse bg-background text-foreground">
      <div className="login-hero-panel relative flex-shrink-0 self-center lg:w-[42%] h-[26dvh] sm:h-[30dvh] lg:h-[68dvh] lg:pr-6 xl:pr-8">
        <div className="relative w-full h-full overflow-hidden lg:rounded-[2rem]">
          <LoginHeroVideo />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-20 bg-background">
        <div className="absolute top-6 left-6 lg:top-8 lg:left-12 flex items-center gap-2.5">
          {/* Logo Starburst */}
          <div className="text-orange-500 dark:text-orange-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1.5V6.5M12 17.5V22.5M4.5 12H9.5M14.5 12H19.5M5.25 5.25L8.5 8.5M15.5 15.5L18.75 18.75M5.25 18.75L8.5 15.5M15.5 8.5L18.75 5.25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-medium tracking-tight text-foreground font-serif">Capacitación</span>
        </div>

        <div className="w-full max-w-lg">
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
