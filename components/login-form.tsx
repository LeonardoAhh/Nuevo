"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LoginSubmitButton, type LoginSubmitStatus } from "@/components/login-submit-button"
import LoginWelcome from "@/components/login-welcome"
import { LOGIN, loginStyles } from "@/lib/login/presentation"
import { MAINTENANCE_NOTICE_PENDING_KEY } from "@/lib/maintenance-notice"
import { HOME_PATH } from "@/lib/navigation"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<LoginSubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitStatus === "loading" || submitStatus === "success") return

    if (!email.trim() || !password) {
      setErrorMessage(LOGIN.requiredFields)
      setSubmitStatus("error")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(LOGIN.invalidEmail)
      setSubmitStatus("error")
      return
    }

    try {
      setErrorMessage("")
      setSubmitStatus("loading")
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError

      const requestedPath = searchParams.get("redirectTo")
      const rawRedirect = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && requestedPath !== "/" && !requestedPath.startsWith("/auth/redirect")
        ? requestedPath
        : HOME_PATH
      setSubmitStatus("success")

      try {
        sessionStorage.setItem(MAINTENANCE_NOTICE_PENDING_KEY, "1")
      } catch {
        // Storage may be unavailable; signing in must still succeed.
      }

      router.push("/auth/redirect?to=" + encodeURIComponent(rawRedirect))
    } catch {
      setErrorMessage(LOGIN.error)
      setSubmitStatus("error")
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
            aria-invalid={submitStatus === "error" && (!email.trim() || errorMessage === LOGIN.invalidEmail)}
            aria-describedby={submitStatus === "error" ? "login-error" : undefined}
            placeholder={LOGIN.emailPlaceholder}
            enterKeyHint="next"
            className={loginStyles.input}
            value={email}
            onChange={event => {
              setEmail(event.target.value)
              if (submitStatus === "error") setSubmitStatus("idle")
            }}
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
              aria-invalid={submitStatus === "error" && !password}
              aria-describedby={submitStatus === "error" ? "login-error" : undefined}
              placeholder={LOGIN.passwordPlaceholder}
              enterKeyHint="go"
              value={password}
              onChange={event => {
                setPassword(event.target.value)
                if (submitStatus === "error") setSubmitStatus("idle")
              }}
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
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {submitStatus === "error" && (
          <p id="login-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </p>
        )}

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
