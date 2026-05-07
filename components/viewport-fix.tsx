"use client"

import { useEffect } from "react"

export function ViewportFix() {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty(
        "--initial-viewport-height",
        `${window.innerHeight}px`
      )
    }

    setVh()
    window.addEventListener("orientationchange", setVh)
    return () => window.removeEventListener("orientationchange", setVh)
  }, [])

  return null
}
