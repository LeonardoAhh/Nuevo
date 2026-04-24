"use client"

import { motion } from "framer-motion"

/**
 * Decorative ambient orbs that drift slowly behind the landing content.
 * Pure CSS + a single `motion` loop. Respects `prefers-reduced-motion` via
 * framer's built-in accessibility. Theme-aware — colored from `--primary`.
 */
export default function AmbientOrbs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
    >
      <motion.div
        className="absolute -top-32 -left-20 size-[520px] rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 size-[620px] rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, -60, 20, 0], y: [0, -20, 40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 size-[480px] rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 30, -40, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
