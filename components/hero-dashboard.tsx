"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/components/theme-context"
import { useUser, useProfile } from "@/lib/hooks"
import { CalendarDays, Clock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { COMPANY_NAME } from "@/lib/constants/company"

// ─── Helpers ─────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 6) return "Buenas noches"
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// ─── Motion variants ─────────────────────────────────────────

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const lineExpand = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.35 } },
}

// ─── Component ───────────────────────────────────────────────

export default function HeroDashboard() {
  const prefersReduced = useReducedMotion()
  const { reducedMotion, density } = useTheme()
  const skipMotion = prefersReduced || reducedMotion

  const { user } = useUser()
  const { profile } = useProfile(user?.id)

  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const greeting = useMemo(() => now ? getGreeting(now.getHours()) : "", [now])
  const timeStr = useMemo(() => now ? formatTime(now) : "", [now])
  const dateStr = useMemo(() => now ? formatDate(now) : "", [now])
  const displayName = profile?.displayName || profile?.firstName || "Bienvenido"

  const isCompact = density === "compact"

  return (
    <div
      className={`hero-dashboard relative w-full rounded-2xl overflow-hidden ${
        isCompact
          ? "h-[160px] sm:h-[200px] md:h-[240px] lg:h-[280px]"
          : "h-[200px] sm:h-[260px] md:h-[300px] lg:h-[340px]"
      }`}
    >
      {/* ── Background image + Ken Burns ── */}
      <motion.div
        className="absolute inset-0"
        initial={skipMotion ? false : { scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <Image
          src="/HERO.png"
          alt="Hero background"
          fill
          className="object-cover hero-zoom"
          priority
        />
      </motion.div>

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10 dark:from-black/85 dark:via-black/55 dark:to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* ── Accent orbs (use --primary so they follow settings) ── */}
      {!skipMotion && (
        <>
          <motion.div
            className="hero-orb hero-orb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />
          <motion.div
            className="hero-orb hero-orb-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
          <motion.div
            className="hero-orb hero-orb-3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
          />
        </>
      )}

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-8 md:px-12"
        variants={skipMotion ? undefined : containerV}
        initial={skipMotion ? undefined : "hidden"}
        animate={skipMotion ? undefined : "show"}
      >
        {/* Greeting badge */}
        <motion.div variants={skipMotion ? undefined : fadeUp}>
          <Badge
            variant="outline"
            className="mb-2 sm:mb-3 w-fit border-white/20 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] sm:text-xs font-medium tracking-wide uppercase gap-1.5 px-2.5 py-0.5"
          >
            <Sparkles size={12} className="text-primary" />
            {greeting}
          </Badge>
        </motion.div>

        {/* Name + company */}
        <motion.h1
          variants={skipMotion ? undefined : fadeUp}
          className={`font-bold text-white leading-[1.15] mb-1 sm:mb-2 ${
            isCompact
              ? "text-xl sm:text-2xl md:text-3xl"
              : "text-2xl sm:text-3xl md:text-5xl"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={displayName}
              initial={skipMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {displayName}
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        <motion.p
          variants={skipMotion ? undefined : fadeUp}
          className={`text-white/60 font-medium leading-tight ${
            isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"
          }`}
        >
          {COMPANY_NAME.toUpperCase()}{" "}
          <span className="text-primary font-semibold">Planta Querétaro</span>
        </motion.p>

        {/* Accent line */}
        <motion.div
          variants={skipMotion ? undefined : lineExpand}
          className="mt-3 sm:mt-4 h-[2px] w-20 sm:w-28 rounded-full bg-gradient-to-r from-primary to-primary/30 origin-left"
        />

        {/* Date & time strip */}
        <motion.div
          variants={skipMotion ? undefined : fadeUp}
          className="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4 flex-wrap"
        >
          <span className="flex items-center gap-1.5 text-white/50 text-[11px] sm:text-xs">
            <CalendarDays size={13} className="text-primary/70" />
            <span className="capitalize">{dateStr}</span>
          </span>
          <span className="flex items-center gap-1.5 text-white/50 text-[11px] sm:text-xs tabular-nums">
            <Clock size={13} className="text-primary/70" />
            {timeStr}
          </span>
        </motion.div>
      </motion.div>

      {/* ── Decorative grid ── */}
      <div className="absolute bottom-0 right-0 w-48 sm:w-64 h-48 sm:h-64 opacity-[0.06] pointer-events-none">
        <div className="hero-grid h-full w-full" />
      </div>

      {/* ── Bottom gradient fade ── */}
      <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
    </div>
  )
}
