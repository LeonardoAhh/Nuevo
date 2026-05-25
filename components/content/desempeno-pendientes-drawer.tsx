"use client"

import { AnimatePresence, motion } from "framer-motion"
import DesempenoPendientes from "./desempeno-pendientes"

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Panel lateral deslizante que contiene la lista de evaluaciones pendientes.
 * Desktop: se desliza desde la derecha con ancho fijo (480 px).
 * Mobile:  ocupa el ancho completo de la pantalla.
 */
export function PendientesDrawer({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Panel ───────────────────────────────────────────────── */}
          <motion.aside
            role="dialog"
            aria-label="Evaluaciones pendientes"
            aria-modal="true"
            className={[
              "fixed top-[50px] bottom-0 right-0 z-[19]",
              "flex h-[calc(100dvh-50px)] w-full flex-col overflow-hidden bg-background",
              "shadow-2xl md:w-[480px] md:border-l md:border-border/60",
            ].join(" ")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            {/* Flatten the inner Card so it sits flush against the panel top */}
            <div className="flex-1 overflow-y-auto scrollbar-thin [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none [&>div>div:first-child]:pt-4">
              <DesempenoPendientes onClose={onClose} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
