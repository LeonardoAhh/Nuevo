"use client"

import Dashboard from "../dashboard"
import CapacitacionChart from "@/components/capacitacion-chart"
import DashboardAlertas from "@/components/dashboard-alertas"

export default function Page() {
  return <Dashboard content={<DashboardContent />} />
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          Seguimiento de capacitación y alertas operativas
        </p>
      </div>

      {/* Widget de alertas de vencimiento */}
      <DashboardAlertas />

      {/* Gráfica de cursos impartidos por año */}
      <CapacitacionChart />
    </div>
  )
}
