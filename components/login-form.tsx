"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LoginSubmitButton, type LoginSubmitStatus } from "@/components/login-submit-button"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<LoginSubmitStatus>("idle")
  
  const router = useRouter()
  const searchParams = useSearchParams()

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

      const rawRedirect = searchParams.get("redirectTo") || "/"
      setSubmitStatus("success")

      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push("/auth/redirect?to=" + encodeURIComponent(rawRedirect))
    } catch {
      setSubmitStatus("error")
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Títulos fuera de la caja */}
      <div className="text-center mb-8 px-2">
        <h1 className="text-4xl sm:text-5xl tracking-tight text-foreground mb-4 font-serif">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground/80">
          Inicia sesión para continuar.
        </p>
      </div>

      {/* Caja del formulario */}
      <div className="w-full max-w-sm rounded-[1.5rem] border border-border/80 bg-card/20 backdrop-blur-sm p-6 sm:p-8">
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="sr-only">
              Correo electrónico
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="Ingresa tu correo electrónico"
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-background/50 border-border/60 transition-colors focus:border-foreground shadow-none rounded-xl px-4 text-foreground placeholder:text-muted-foreground/70"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="password" className="sr-only">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-background/50 border-border/60 transition-colors focus:border-foreground shadow-none rounded-xl pl-4 pr-12 text-foreground placeholder:text-muted-foreground/70"
              data-testid="login-password-input"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="pt-2">
            <LoginSubmitButton
              status={submitStatus}
              className="h-12 w-full rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              data-testid="login-submit"
            >
              Continuar con correo electrónico
            </LoginSubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
