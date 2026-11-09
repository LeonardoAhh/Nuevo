import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import LoginForm from "@/components/login-form"
import LoginPromoPanel from "@/components/login-promo-panel"
import { LOGIN, loginStyles } from "@/lib/login/presentation"

export default function LoginShell() {
  return (
    <main className={`${loginStyles.page} workspace-shell`}>
      <div className="workspace-frame bg-card md:rounded-xl md:border md:border-border">
        <div className={loginStyles.container}>
          <LoginPromoPanel />
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
      </div>
    </main>
  )
}
