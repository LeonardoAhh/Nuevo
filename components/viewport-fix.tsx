"use client"

import { useEffect } from "react"

export function ViewportFix() {
  useEffect(() => {
    const setVh = () => {
      // Altura inicial del viewport (antes del teclado)
      document.documentElement.style.setProperty(
        "--initial-viewport-height",
        `${window.innerHeight}px`
      )
    }

    const setVisualVh = () => {
      if (!window.visualViewport) return
      // Altura real visible (se reduce cuando aparece el teclado)
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${window.visualViewport.height}px`
      )
    }

    // Inicializar ambas
    setVh()
    setVisualVh()

    // Actualizar en orientación y resize del viewport visual
    window.addEventListener("orientationchange", setVh)
    window.visualViewport?.addEventListener("resize", setVisualVh)
    window.visualViewport?.addEventListener("scroll", setVisualVh)

    return () => {
      window.removeEventListener("orientationchange", setVh)
      window.visualViewport?.removeEventListener("resize", setVisualVh)
      window.visualViewport?.removeEventListener("scroll", setVisualVh)
    }
  }, [])

  return null
}
