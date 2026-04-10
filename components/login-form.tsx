"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react"
import { useTheme } from "@/components/theme-context"
import { supabase } from "@/lib/supabase/client"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor completa todos los campos")
      return
    }

    try {
      setIsLoading(true)
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      const redirectTo = searchParams.get("redirectTo") || "/"
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err?.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos"
        : (err?.message ?? "Error al iniciar sesión"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="login-fade-up shadow-xl border-border/50 backdrop-blur-sm bg-card/80 dark:bg-card/60" style={{ animationDelay: "550ms" }}>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20 login-shake">
              {error}
            </div>
          )}

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
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
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
      </CardContent>
    </Card>
  )
}
