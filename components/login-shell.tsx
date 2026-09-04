import { Suspense } from "react"
import { GraduationCap, Loader2 } from "lucide-react"
import LoginForm from "@/components/login-form"
import { LOGIN, loginStyles } from "@/lib/login/presentation"

export default function LoginShell() {
  return (
    <main className={loginStyles.page}>
      <div className={loginStyles.container}>
        <header className={loginStyles.brand}>
          <span className={loginStyles.brandIcon} aria-hidden="true">
            <GraduationCap className="size-5" />
          </span>
          <span>{LOGIN.brand}</span>
        </header>

        <section aria-label={LOGIN.pageTitle} className={loginStyles.formRegion}>
          <Suspense fallback={
            <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {LOGIN.loading}
            </div>
          }>
            <LoginForm />
          </Suspense>
        </section>
      </div>
    </main>
  )
}
