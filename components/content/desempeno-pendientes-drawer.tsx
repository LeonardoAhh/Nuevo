"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import DesempenoPendientes from "./desempeno-pendientes"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PendientesDrawerProps {
  open: boolean
  onClose: () => void
  filterDepartamentos?: string[] | null
  periodoSemestral?: string
}

// ─── Constante de animación ───────────────────────────────────────────────────

const SPRING = { type: "spring", stiffness: 300, damping: 32 } as const

// ─── Hook: accesibilidad del drawer ──────────────────────────────────────────

function useDrawerAccessibility(open: boolean, onClose: () => void) {
  const drawerRef = useRef<HTMLElement>(null)

  // Cierre con Escape + restaurar foco
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const getFocusable = (): HTMLElement[] =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      )

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !drawerRef.current?.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    // Mover foco al primer elemento interactivo
    getFocusable()[0]?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  // Bloquear scroll del body
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      window.scrollTo(0, scrollY)
    }
  }, [open])

  return drawerRef
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

function DrawerBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="drawer-backdrop"
      className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:bg-foreground/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      aria-hidden="true"
    />
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PendientesDrawer({
  open,
  onClose,
  filterDepartamentos,
  periodoSemestral,
}: PendientesDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const drawerRef = useDrawerAccessibility(open, onClose)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <DrawerBackdrop onClose={onClose} />

          <motion.aside
            ref={drawerRef}
            key="pendientes-drawer"
            role="dialog"
            aria-label="Evaluaciones pendientes"
            aria-modal="true"
            aria-describedby="pendientes-drawer-desc"
            className={[
              // Posición — offset del header vía variable CSS definida en globals.css
              // :root { --header-height: 50px; }  ← ya existe en tu .h-[50px] density rule
              "fixed bottom-0 right-0",
              "top-[var(--header-height,50px)]",
              "h-[calc(100dvh-var(--header-height,50px))]",

              // Z-index — por encima del backdrop (z-40), por debajo de modales críticos
              "z-50",

              // Ancho responsivo — sin valores sueltos en el JSX
              // Añadir en globals.css:
              //   @media (min-width: 768px)  { :root { --drawer-width: 600px; } }
              //   @media (min-width: 1024px) { :root { --drawer-width: 720px; } }
              "w-full md:w-[var(--drawer-width,600px)]",

              // Estructura
              "flex flex-col overflow-hidden",

              // Colores — 100% tokens del sistema, cero hardcoding
              "bg-card text-card-foreground",

              // Borde lateral solo en desktop (ya tienes --border en globals)
              "md:border-l md:border-border",

              // Sombra semántica (puedes añadir --shadow-drawer en globals si quieres variar por tema)
              "shadow-2xl",
            ].join(" ")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING}
            // Swipe-to-close en mobile
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.25 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 && info.velocity.x > 40) onClose()
            }}
          >
            {/* Handle de agarre — solo mobile, tokens del sistema */}
            <div
              className="flex flex-shrink-0 justify-center pb-1 pt-3 md:hidden"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Descripción accesible (sr-only) */}
            <span id="pendientes-drawer-desc" className="sr-only">
              Panel lateral con evaluaciones de desempeño pendientes de revisión
            </span>

            {/* Contenido scrolleable — reutiliza tu clase .scrollbar-thin de globals.css */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
              <DesempenoPendientes
                onClose={onClose}
                filterDepartamentos={filterDepartamentos}
                periodoSemestral={periodoSemestral}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
