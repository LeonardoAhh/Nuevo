"use client"

import { useState } from "react"
import DashboardAlertas from "@/components/dashboard-alertas"
import DashboardCumplimiento from "@/components/dashboard-cumplimiento"
import DashboardYearlyCompliance from "@/components/dashboard-yearly-compliance"
import HeroDashboard from "@/components/hero-dashboard"
import RgCumplimientoChart from "@/components/rg-cumplimiento-chart"
import CapacitacionChart from "@/components/capacitacion-chart"
import NotesWidget from "@/components/notes-widget"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StickyNote, Bell, GraduationCap } from "lucide-react"

export default function DashboardHome() {
  const [tab, setTab] = useState("notas")

  return (
    <div className="space-y-4">
      <HeroDashboard />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="notas" className="gap-1.5 text-xs sm:text-sm">
            <StickyNote size={14} className="hidden sm:inline" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5 text-xs sm:text-sm">
            <Bell size={14} className="hidden sm:inline" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="capacitacion" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap size={14} className="hidden sm:inline" />
            <span className="sm:hidden">Capacit.</span>
            <span className="hidden sm:inline">Capacitación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="space-y-6 mt-4">
          <NotesWidget />
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6 mt-4">
          <DashboardAlertas />
        </TabsContent>

        <TabsContent value="capacitacion" className="space-y-6 mt-4">
          <DashboardCumplimiento />
          <RgCumplimientoChart />
          <CapacitacionChart />
          <DashboardYearlyCompliance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
