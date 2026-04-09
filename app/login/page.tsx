import type { Metadata } from "next"
import { Suspense } from "react"
import LoginForm from "@/components/login-form"
import { ThemeProvider } from "@/components/theme-context"

export const metadata: Metadata = {
  title: "Login | Dashboard",
  description: "Login to your dashboard account",
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

        </div>
      </div>
    </ThemeProvider>
  )
}
