"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import DesempenoPendientes from "./desempeno-pendientes"

interface Props {
  open: boolean
  onClose: () => void
  filterDepartamentos?: string[] | null
  periodoSemestral?: string
}

export function PendientesDrawer({ open, onClose, filterDepartamentos, periodoSemestral }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          key="pendientes-drawer"
          role="dialog"
          aria-label="Evaluaciones pendientes"
          aria-modal="true"
          className={[
            "fixed top-[50px] bottom-0 right-0 z-[100]",
            "flex h-[calc(100dvh-50px)] w-full flex-col overflow-hidden bg-card",
            "shadow-2xl md:w-[480px] md:border-l md:border-border/60",
          ].join(" ")}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <DesempenoPendientes onClose={onClose} filterDepartamentos={filterDepartamentos} periodoSemestral={periodoSemestral} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  )
}
