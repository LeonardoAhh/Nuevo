"use client"

import { type ReactNode } from "react"
import { motion, type Variants } from "framer-motion"

export const BOT_WHATSAPP_NUMBER = "5215529296117"
export const BOT_WHATSAPP_PREFILL = "Hola"
export const BOT_WHATSAPP_URL = `https://wa.me/${BOT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  BOT_WHATSAPP_PREFILL,
)}`
export const RECURSOS_URL = "https://vinoplasticqro.xyz/recursos"

/**
 * Reusable section wrapper. Padding scales with the viewport and the
 * optional `id` lets the in-page nav (if we add one) anchor-link it.
 */
export function Section({
  id,
  children,
  className = "",
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={
        "mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20 md:py-24 " + className
      }
    >
      {children}
    </section>
  )
}

/**
 * Eyebrow label used at the top of each section — small caps, primary tint,
 * stays legible in both themes.
 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      {children}
    </p>
  )
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

/**
 * Container that reveals its children on scroll with staggered fade-up.
 * Uses `whileInView` with `once` so it animates only on first reveal.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "section" | "ul" | "ol"
}) {
  const Component = motion[Tag] as typeof motion.div
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={stagger}
      className={className}
    >
      {children}
    </Component>
  )
}

export function RevealItem({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
