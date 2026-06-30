"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

const easeOutExpo = [0.16, 1, 0.3, 1] as const

type Step = 0 | 1 | 2
const TOTAL_STEPS = 3

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: easeOutExpo } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -28 : 28, transition: { duration: 0.25, ease: "easeIn" } }),
}

const errorShake: Variants = {
  initial: { opacity: 0, x: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    x: [0, -6, 6, -4, 4, 0],
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
}

export default function LoginForm() {
  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState(1)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errorKey, setErrorKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const showError = (msg: string) => {
    setError(msg)
    setErrorKey((k) => k + 1)
  }

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1)
    setError("")
    setStep(next)
  }

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailPattern.test(email.trim())) {
      showError("Ingresa un correo electrónico válido")
      return
    }
    goTo(2)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password) {
      showError("Ingresa tu contraseña")
      return
    }

    try {
      setIsLoading(true)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError

      requestPushPermission().catch(() => {})

      const rawRedirect = searchParams.get("redirectTo") || "/"
      router.push("/auth/redirect?to=" + encodeURIComponent(rawRedirect))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      showError(
        msg === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : msg || "Error al iniciar sesión",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Indicador de progreso */}
      <div
        className="mb-6 flex items-center gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step + 1}
        aria-label={`Paso ${step + 1} de ${TOTAL_STEPS}`}
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? "w-8 bg-primary"
                : i < step
                  ? "w-4 bg-primary/50"
                  : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Mensaje de error (compartido entre pasos) */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key={errorKey}
            variants={errorShake}
            initial="initial"
            animate="animate"
            exit="exit"
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {/* ───────── Paso 0 · Bienvenida ───────── */}
        {step === 0 && (
          <motion.section
            key="step-welcome"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            aria-labelledby="login-welcome-title"
          >
            <h1
              id="login-welcome-title"
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nos da gusto verte de nuevo. Continúa para iniciar sesión en tu cuenta.
            </p>

            <Button
              type="button"
              autoFocus
              onClick={() => goTo(1)}
              className="group mt-8 h-11 w-full font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              data-testid="login-welcome-continue"
            >
              Continuar
              <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </motion.section>
        )}

        {/* ───────── Paso 1 · Correo ───────── */}
        {step === 1 && (
          <motion.section
            key="step-email"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            aria-labelledby="login-email-title"
          >
            <StepBack onClick={() => goTo(0)} label="Volver a la bienvenida" />

            <h2 id="login-email-title" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              ¿Cuál es tu correo?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Usaremos tu correo electrónico para identificarte.
            </p>

            <form onSubmit={handleEmailContinue} className="mt-6 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                  Correo electrónico
                </Label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-colors group-focus-within:text-primary">
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
                    className="h-11 pl-10 transition-shadow focus:shadow-md focus:shadow-primary/10"
                    aria-invalid={!!error}
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="group h-11 w-full font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                data-testid="login-email-continue"
              >
                Continuar
                <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </form>
          </motion.section>
        )}

        {/* ───────── Paso 2 · Contraseña ───────── */}
        {step === 2 && (
          <motion.section
            key="step-password"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            aria-labelledby="login-password-title"
          >
            <StepBack onClick={() => goTo(1)} label="Volver al correo" />

            <h2 id="login-password-title" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Ingresa tu contraseña
            </h2>

            {/* Chip de correo con opción de editar */}
            <button
              type="button"
              onClick={() => goTo(1)}
              className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/50 py-1 pl-3 pr-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              aria-label={`Cambiar correo, actualmente ${email}`}
              data-testid="login-edit-email"
            >
              <MailIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{email}</span>
              <PencilIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </button>

            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              {/* Campo oculto de email para gestores de contraseñas / accesibilidad */}
              <input type="email" name="email" value={email} autoComplete="username" readOnly className="sr-only" tabIndex={-1} aria-hidden />

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
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
                    autoFocus
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 transition-shadow focus:shadow-md focus:shadow-primary/10"
                    aria-invalid={!!error}
                    data-testid="login-password-input"
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? "off" : "on"}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                        className="inline-flex"
                      >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
                  Recordarme
                </Label>
              </div>

              <Button
                type="submit"
                className="h-11 w-full font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                disabled={isLoading}
                data-testid="login-submit"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="login-spinner h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Iniciando sesión...
                  </span>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
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
