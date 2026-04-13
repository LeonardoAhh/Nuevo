"use client"

import Dashboard from "@/components/Dashboard"
import CapacitacionChart from "@/components/capacitacion-chart"
import DashboardAlertas from "@/components/dashboard-alertas"
import DashboardCumplimiento from "@/components/dashboard-cumplimiento"
import HeroDashboard from "@/components/hero-dashboard"
import RgCumplimientoChart from "@/components/rg-cumplimiento-chart"

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

      {/* Cumplimiento general de capacitación */}
      <DashboardCumplimiento />

      {/* Cumplimiento RG-REC-048 por departamento (trimestral) */}
      <RgCumplimientoChart />

      {/* Gráfica de cursos impartidos por año */}
      <CapacitacionChart />
    </div>
  )
}
