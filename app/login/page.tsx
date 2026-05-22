import type { Metadata } from "next"
import { Suspense } from "react"
import LoginForm from "@/components/login-form"
import LoginHero from "@/components/login-hero"
import LoginWelcome from "@/components/login-welcome"

export const metadata: Metadata = {
  title: "Login | Capacitación Qro",
  description: "Login to your dashboard account",
}

export default function LoginPage() {
  return (
    <div className="login-page min-h-[100dvh] flex flex-col lg:flex-row bg-background text-foreground">
      {/* ── Hero Panel (izquierda en desktop, arriba en móvil) ── */}
      <div className="login-hero-panel relative flex-shrink-0 lg:w-[55%] xl:w-[58%] h-[48dvh] sm:h-[52dvh] lg:h-auto lg:min-h-[100dvh]">
        <LoginHero />
      </div>

      {/* ── Form Panel (derecha en desktop, abajo en móvil) ── */}
      <div className="relative z-10 -mt-10 lg:mt-0 flex flex-1 items-start lg:items-center justify-center px-4 pt-2 sm:px-8 lg:px-12 xl:px-20 bg-background rounded-t-3xl lg:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:shadow-none safe-bottom-content">
        <div className="w-full max-w-md">
          <LoginWelcome />

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
