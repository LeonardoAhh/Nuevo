import type { Metadata } from "next"
import { Suspense } from "react"
import LoginForm from "@/components/login-form"
import { ThemeProvider } from "@/components/theme-context"
import LoginHero from "@/components/login-hero"

export const metadata: Metadata = {
  title: "Login | Dashboard",
  description: "Login to your dashboard account",
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <div className="login-page min-h-[100dvh] flex flex-col lg:flex-row bg-background text-foreground">
        {/* ── Hero Panel (izquierda en desktop, arriba en móvil) ── */}
        <div className="login-hero-panel relative flex-shrink-0 lg:w-[55%] xl:w-[58%] h-[36dvh] sm:h-[40dvh] lg:h-auto lg:min-h-[100dvh]">
          <LoginHero />
        </div>

        {/* ── Form Panel (derecha en desktop, abajo en móvil) ── */}
        <div className="relative z-10 -mt-10 lg:mt-0 flex flex-1 items-start lg:items-center justify-center px-4 pt-2 pb-8 sm:px-8 lg:px-12 xl:px-20 bg-background rounded-t-3xl lg:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:shadow-none">
          <div className="w-full max-w-md login-form-entrance">
            <div className="text-center mb-6 lg:mb-8 lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground login-fade-up" style={{ animationDelay: "300ms" }}>
                Bienvenido de vuelta
              </h1>
              <p className="mt-2 text-sm text-muted-foreground login-fade-up" style={{ animationDelay: "450ms" }}>
                Inicia sesión para continuar
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
