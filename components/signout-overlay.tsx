"use client"

import { AnimatePresence } from "framer-motion"
import { AppTransition } from "@/components/app-transition"

interface SignOutOverlayProps {
  show: boolean
  message?: string
}

export default function SignOutOverlay({
  show,
  message = "Cerrando sesión…",
}: SignOutOverlayProps) {
  return (
    <AnimatePresence>
      {show ? <AppTransition key="signout" mode="overlay" message={message} /> : null}
    </AnimatePresence>
  )
}
