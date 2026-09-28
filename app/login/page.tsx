import type { Metadata } from "next"
import LoginShell from "@/components/login-shell"
import { LOGIN } from "@/lib/login/presentation"

export const metadata: Metadata = {
  title: LOGIN.pageTitle,
  description: LOGIN.pageDescription,
}

export default function LoginPage() {
  return <LoginShell />
}
