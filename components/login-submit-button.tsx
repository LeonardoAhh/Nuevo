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
      className={cn(
        loginStyles.submit, 
        isSuccess && "bg-brand text-brand-foreground hover:bg-brand/90",
        className
      )}
      disabled={isLoading || isSuccess}
      aria-busy={isLoading}
      {...props}
    >
      <Icon 
        className={cn(
          "size-4 transition-all duration-300", 
          isLoading && "animate-spin motion-reduce:animate-none",
          isSuccess && "animate-in zoom-in duration-300"
        )} 
        aria-hidden="true" 
      />
      <span className={cn("transition-all duration-300", isSuccess && "animate-in fade-in slide-in-from-bottom-1")}>
        {isLoading ? LOGIN.submitting : isSuccess ? LOGIN.success : status === "error" ? LOGIN.retry : children}
      </span>
    </Button>
  )
}
