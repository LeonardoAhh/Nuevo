"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { AppTransition } from "@/components/app-transition"
import { LOGIN_PATH } from "@/lib/navigation"

interface SignOutContextValue {
  signingOut: boolean
  setSigningOut: (signingOut: boolean) => void
}

const SignOutContext = createContext<SignOutContextValue | null>(null)

export function SignOutProvider({ children }: { children: ReactNode }) {
  const [signingOut, setSigningOut] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === LOGIN_PATH) {
      // The global transition must remain mounted until navigation reaches login.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSigningOut(false)
    }
  }, [pathname])

  return (
    <SignOutContext.Provider value={{ signingOut, setSigningOut }}>
      {children}
      <AnimatePresence>
        {signingOut && <AppTransition key="signout" mode="overlay" message="Cerrando sesión…" />}
      </AnimatePresence>
    </SignOutContext.Provider>
  )
}

export function useSignOut() {
  const context = useContext(SignOutContext)
  if (!context) throw new Error("useSignOut must be used within SignOutProvider")
  return context
}
