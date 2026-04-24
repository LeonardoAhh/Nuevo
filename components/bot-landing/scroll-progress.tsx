"use client"

import { motion, useScroll, useSpring } from "framer-motion"

/**
 * Thin progress bar at the top of the page that tracks vertical scroll.
 * Uses `useSpring` for a smoother, less jittery motion.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 24,
    mass: 0.3,
  })

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-primary/90"
      style={{ scaleX }}
    />
  )
}
