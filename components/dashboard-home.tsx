"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import DashboardAlertas from "@/components/dashboard-alertas"
import DashboardCumplimiento from "@/components/dashboard-cumplimiento"
import DashboardYearlyCompliance from "@/components/dashboard-yearly-compliance"
import HeroDashboard from "@/components/hero-dashboard"
import RgCumplimientoChart from "@/components/rg-cumplimiento-chart"
import CapacitacionChart from "@/components/capacitacion-chart"
import NotesWidget from "@/components/notes-widget"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StickyNote, Bell, GraduationCap } from "lucide-react"
import {
  DashboardAlertasProvider,
  useDashboardAlertasShared,
} from "@/components/dashboard-alertas-context"
import { useTheme } from "@/components/theme-context"

// ─── Motion variants ─────────────────────────────────────────────────────────

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.12, ease: EASE_PREMIUM },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

// ─── Tab Alertas trigger ──────────────────────────────────────────────────────

function AlertasTabTrigger() {
  const { totalAlertas, loading } = useDashboardAlertasShared()
  const showBadge = !loading && totalAlertas > 0
  return (
    <TabsTrigger value="alertas" className="gap-1.5 text-xs sm:text-sm">
      <Bell size={14} className="hidden sm:inline" />
      Alertas
      {showBadge && (
        <span
          aria-label={`${totalAlertas} alertas pendientes`}
          className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground"
        >
          {totalAlertas > 99 ? "99+" : totalAlertas}
        </span>
      )}
    </TabsTrigger>
  )
}

// ─── Capacitación cards staggered ────────────────────────────────────────────

const capacitacionCards = [
  DashboardCumplimiento,
  RgCumplimientoChart,
  CapacitacionChart,
  DashboardYearlyCompliance,
]

function CapacitacionTab({ skip }: { skip: boolean }) {
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {capacitacionCards.map((Card, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={skip ? undefined : cardVariants}
          initial={skip ? false : "hidden"}
          animate={skip ? false : "show"}
        >
          <Card />
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardHome() {
  const [tab, setTab] = useState("alertas")
  // Keep-alive: mount each tab's heavy content only after first visit,
  // then keep it mounted (preserves scroll/state without refetching).
  const [visited, setVisited] = useState<Set<string>>(new Set(["alertas"]))
  // Track previous tab for AnimatePresence key
  const prevTab = useRef(tab)

  const prefersReduced = useReducedMotion()
  const { reducedMotion } = useTheme()
  const skipMotion = prefersReduced || reducedMotion

  useEffect(() => {
    setVisited((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)))
    prevTab.current = tab
  }, [tab])

  return (
    <DashboardAlertasProvider>
      <div className="space-y-4">
        <HeroDashboard />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10">
            <AlertasTabTrigger />
            <TabsTrigger value="notas" className="gap-1.5 text-xs sm:text-sm">
              <StickyNote size={14} className="hidden sm:inline" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="capacitacion" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap size={14} className="hidden sm:inline" />
              <span className="sm:hidden">Capacit.</span>
              <span className="hidden sm:inline">Capacitación</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alertas" className="mt-4">
            {visited.has("alertas") && <DashboardAlertas />}
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            {visited.has("notas") && <NotesWidget />}
          </TabsContent>

          <TabsContent value="capacitacion" className="mt-4">
            {visited.has("capacitacion") && (
              <CapacitacionTab skip={!!skipMotion} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardAlertasProvider>
  )
}
