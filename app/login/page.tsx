import type { Metadata } from "next"
import LoginShell from "@/components/login-shell"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your dashboard account",
}

export default function LoginPage() {
  return <LoginShell />
}
