"use client"

import type React from "react"

import { useId, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  PencilIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { requestPushPermission } from "@/lib/supabase/push"
import { LoginSubmitButton, type LoginSubmitStatus } from "@/components/login-submit-button"

const easeOutExpo = [0.16, 1, 0.3, 1] as const

type Step = 0 | 1
const TOTAL_STEPS = 2

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: easeOutExpo } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -28 : 28, transition: { duration: 0.25, ease: "easeIn" } }),
}

function getStepVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 1, x: 0 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 0, transition: { duration: 0 } },
    }
  }

  return {
    enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: easeOutExpo } },
    exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -28 : 28, transition: { duration: 0.25, ease: "easeIn" } }),
  }
}

export default function LoginForm() {
  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState(1)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<LoginSubmitStatus>("idle")
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefersReducedMotion = useReducedMotion() ?? false

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1)
    setSubmitStatus("idle")
    setStep(next)
  }



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailPattern.test(email.trim()) || !password) {
      setSubmitStatus("error")
      setTimeout(() => setSubmitStatus("idle"), 2000)
      return
    }

    try {
      setSubmitStatus("loading")
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError

      requestPushPermission().catch(() => {})

      const rawRedirect = searchParams.get("redirectTo") || "/"
      setSubmitStatus("success")

      // Esperar a que se reproduzca la animación de éxito antes de redirigir (aprox 800ms)
      await new Promise(resolve => setTimeout(resolve, 1500))

      router.push("/auth/redirect?to=" + encodeURIComponent(rawRedirect))
    } catch (err: unknown) {
      setSubmitStatus("error")
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {/* ───────── Paso 0 · Bienvenida ───────── */}
        {step === 0 && (
          <motion.section
            key="step-welcome"
            custom={direction}
            variants={getStepVariants(prefersReducedMotion)}
            initial="enter"
            animate="center"
            exit="exit"
            aria-labelledby="login-welcome-title"
          >
            <h1
              id="login-welcome-title"
              className="text-2xl font-medium tracking-tight text-ink sm:text-3xl"
            >
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para continuar.
            </p>

            <Button
              type="button"
              autoFocus
              onClick={() => goTo(1)}
              className="group mt-8 h-11 w-full font-medium tracking-wide transition-colors"
              data-testid="login-welcome-continue"
            >
              Ingresar con correo
              <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </motion.section>
        )}

        {/* ───────── Paso 1 · Formulario Completo ───────── */}
        {step === 1 && (
          <motion.section
            key="step-form"
            custom={direction}
            variants={getStepVariants(prefersReducedMotion)}
            initial="enter"
            animate="center"
            exit="exit"
            aria-labelledby="login-form-title"
          >
            <StepBack onClick={() => goTo(0)} label="Volver a la bienvenida" />

            <h2 id="login-form-title" className="text-xl font-medium tracking-tight text-ink sm:text-2xl mt-2">
              Inicia sesión
            </h2>

            <form onSubmit={handleLogin} className="mt-6 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-ink">
                  Correo electrónico
                </Label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MailIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    enterKeyHint="next"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 bg-card border-border/60 transition-colors focus:border-primary shadow-none"
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-ink">
                  Contraseña
                </Label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 bg-card border-border/60 transition-colors focus:border-primary shadow-none"
                    data-testid="login-password-input"
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? "off" : "on"}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
                        className="inline-flex"
                      >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              <LoginSubmitButton
                status={submitStatus}
                data-testid="login-submit"
              >
                Iniciar sesión
              </LoginSubmitButton>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function StepBack({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mb-4 -ml-1 inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="login-step-back"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Atrás
    </button>
  )
}
