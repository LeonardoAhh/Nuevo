"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { requestPushPermission } from "@/lib/supabase/push"

const easeOutExpo = [0.16, 1, 0.3, 1] as const

const formEntrance: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutExpo, delay: 0.2 },
  },
}

// re-triggered on each error by changing React key
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  // bump on each error to re-trigger shake animation
  const [errorKey, setErrorKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor completa todos los campos")
      setErrorKey((k) => k + 1)
      return
    }

    try {
      setIsLoading(true)
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Solicitar permiso de notificaciones DESPUÉS de login exitoso (una sola vez)
      requestPushPermission().catch(() => {})

      const redirectTo = searchParams.get("redirectTo") || "/"
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      setError(
        msg === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : msg || "Error al iniciar sesión",
      )
      setErrorKey((k) => k + 1)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div variants={formEntrance} initial="hidden" animate="visible">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key={errorKey}
              variants={errorShake}
              initial="initial"
              animate="animate"
              exit="exit"
              role="alert"
              className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground/80 text-sm font-medium">
            Correo electrónico
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
              <MailIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 transition-shadow focus:shadow-md focus:shadow-primary/10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground/80 text-sm font-medium">
            Contraseña
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11 transition-shadow focus:shadow-md focus:shadow-primary/10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <EyeIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
              Recordarme
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="login-spinner h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </motion.div>
  )
}
