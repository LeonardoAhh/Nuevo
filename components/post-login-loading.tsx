"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useRole } from "@/lib/hooks"

// Minimum time to show the screen so the animation plays fully
const MIN_MS = 4500

export function PostLoginLoading() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("to") ?? "/"

  const { role, loading: roleLoading } = useRole()
  const router = useRouter()

  const [minDone, setMinDone] = useState(false)
  const [exiting, setExiting] = useState(false)
  const didRedirect = useRef(false)

  // Enforce minimum display time
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  // Redirect once role is resolved and minimum time has passed
  useEffect(() => {
    if (roleLoading || !minDone || didRedirect.current) return
    didRedirect.current = true

    // evaluador always lands on /desempeno regardless of the original target
    const destination = role === "evaluador" ? "/desempeno" : redirectTo

    setExiting(true)
    const t = setTimeout(() => router.replace(destination), 550)
    return () => clearTimeout(t)
  }, [roleLoading, minDone, role, redirectTo, router])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background"
      animate={exiting ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      initial={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Background blobs ─────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]"
        animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-primary/[0.09] blur-[100px]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.55, 0.25, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[55%] top-[15%] h-[280px] w-[280px] rounded-full bg-primary/[0.05] blur-[80px]"
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* ── Logo card ────────────────────────────────────────── */}
      <motion.div
        className="relative mb-8 flex items-center justify-center"
        initial={{ scale: 0.45, opacity: 0, y: 36 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.05 }}
      >
        {/* Outermost ring */}
        <motion.div
          className="absolute h-44 w-44 rounded-[2.75rem] border border-primary/10"
          animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.93, 1.07, 0.93] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute h-36 w-36 rounded-[2.25rem] border border-primary/20"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Logo card — gentle bob */}
        <motion.div
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/10"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner shimmer */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/10"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <span className="relative select-none text-4xl font-bold text-primary">V</span>
        </motion.div>
      </motion.div>

      {/* ── Brand + message ──────────────────────────────────── */}
      <motion.div
        className="mb-10 space-y-2 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-xl font-bold tracking-tight">
          <span className="text-primary">VIÑO</span>
          <span className="text-foreground">PLASTIC</span>
        </p>
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          Preparando tu espacio…
        </motion.p>
      </motion.div>

      {/* ── Bouncing dots ────────────────────────────────────── */}
      <motion.div
        className="flex gap-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {([0, 0.18, 0.36] as const).map((delay, i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-primary"
            animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 0.9,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
