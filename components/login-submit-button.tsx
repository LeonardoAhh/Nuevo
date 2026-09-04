"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Check, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LOGIN, loginStyles } from "@/lib/login/presentation"
import { cn } from "@/lib/utils"

export type LoginSubmitStatus = "idle" | "loading" | "success" | "error"

interface LoginSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  status: LoginSubmitStatus
  children: ReactNode
}

export function LoginSubmitButton({ status, children, className, ...props }: LoginSubmitButtonProps) {
  const isLoading = status === "loading"
  const isSuccess = status === "success"
  const Icon = isLoading ? Loader2 : isSuccess ? Check : LogIn

  return (
    <Button
      type="submit"
      className={cn(loginStyles.submit, className)}
      disabled={isLoading || isSuccess}
      aria-busy={isLoading}
      {...props}
    >
      <Icon className={cn("size-4", isLoading && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
      {isLoading ? LOGIN.submitting : isSuccess ? LOGIN.success : status === "error" ? LOGIN.retry : children}
    </Button>
  )
}
