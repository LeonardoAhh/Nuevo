"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LoginSubmitButton, type LoginSubmitStatus } from "@/components/login-submit-button"
import LoginWelcome from "@/components/login-welcome"
import { LOGIN, loginStyles } from "@/lib/login/presentation"

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
    <div className={loginStyles.form}>
      <LoginWelcome />
          <form onSubmit={handleLogin} className={loginStyles.fields} noValidate aria-labelledby="login-title" aria-describedby="login-description">
            <div className={loginStyles.field}>
              <Label htmlFor="email">{LOGIN.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-required="true"
                placeholder={LOGIN.emailPlaceholder}
                enterKeyHint="next"
                className={loginStyles.input}
                value={email}
                onChange={event => setEmail(event.target.value)}
                data-testid="login-email-input"
              />
            </div>

            <div className={loginStyles.field}>
              <Label htmlFor="password">{LOGIN.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-required="true"
                  placeholder={LOGIN.passwordPlaceholder}
                  enterKeyHint="go"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className={loginStyles.passwordInput}
                  data-testid="login-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={loginStyles.passwordToggle}
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? LOGIN.hidePassword : LOGIN.showPassword}
                  aria-controls="password"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
            </div>

            {submitStatus === "error" && <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{LOGIN.error}</AlertDescription>
            </Alert>}

            <LoginSubmitButton status={submitStatus} data-testid="login-submit">
              {LOGIN.submit}
            </LoginSubmitButton>
            <p role="status" className="sr-only">
              {submitStatus === "loading" ? LOGIN.submitting : submitStatus === "success" ? LOGIN.success : ""}
            </p>
          </form>
    </div>
  )
}
