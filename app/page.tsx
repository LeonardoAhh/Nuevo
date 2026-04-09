"use client"

import Dashboard from "@/components/dashboard"
import CapacitacionChart from "@/components/capacitacion-chart"
import DashboardAlertas from "@/components/dashboard-alertas"
import HeroDashboard from "@/components/hero-dashboard"

export default function Page() {
  return <Dashboard pageTitle="Dashboard" content={<DashboardContent />} />
}

function DashboardContent() {
  return (
    <div className="space-y-6">

      {/* Hero principal */}
      <HeroDashboard />

      {/* Widget de alertas de vencimiento */}
      <DashboardAlertas />

      {/* Gráfica de cursos impartidos por año */}
      <CapacitacionChart />
    </div>
  )
}
