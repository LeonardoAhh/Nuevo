"use client"

import Dashboard from "../dashboard"
import CapacitacionChart from "@/components/capacitacion-chart"
import { ThemeProvider } from "@/theme-context"

export default function Page() {
  return (
    <ThemeProvider>
      <Dashboard content={<DashboardContent />} />
    </ThemeProvider>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          Seguimiento de capacitación por mes y departamento
        </p>
      </div>
      <CapacitacionChart />
    </div>
  )
}
