"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { CheckIcon, XIcon } from "lucide-react"

export type LoginSubmitStatus = "idle" | "loading" | "success" | "error"

interface LoginSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status: LoginSubmitStatus
  children: React.ReactNode
}

export function LoginSubmitButton({ status, children, className, ...props }: LoginSubmitButtonProps) {
  const isError = status === "error"
  const isSuccess = status === "success"
  const isLoading = status === "loading"

  // Variants for the shake animation on error
  const shakeVariants = {
    idle: { x: 0 },
    error: {
      x: [0, -6, 6, -4, 4, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  // Determine the background class based on status
  let bgClass = ""
  if (isError) bgClass = "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  else if (isSuccess) bgClass = "bg-success text-success-foreground hover:bg-success/90"

  return (
    <motion.div
      variants={shakeVariants}
      initial="idle"
      animate={isError ? "error" : "idle"}
      className="w-full mt-2"
    >
      <Button
        type="submit"
        className={`relative h-11 w-full font-medium tracking-wide transition-colors overflow-hidden ${bgClass} ${className || ""}`}
        disabled={isLoading || isSuccess}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center gap-2"
            >
              <span className="login-spinner h-4 w-4 rounded-full border-2 border-current/30 border-t-current" />
              Iniciando sesión...
            </motion.span>
          )}

          {isSuccess && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center gap-2"
            >
              <CheckIcon className="h-5 w-5" />
              ¡Bienvenido!
            </motion.span>
          )}

          {isError && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center gap-2"
            >
              <XIcon className="h-5 w-5" />
              Error
            </motion.span>
          )}

          {!isLoading && !isSuccess && !isError && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}
