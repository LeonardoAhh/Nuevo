import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DashboardHome from "@/components/dashboard-home"

export const metadata: Metadata = {
  title: "Inicio",
}

export default function HomePage() {
  return <Dashboard pageTitle="Inicio" content={<DashboardHome />} />
}
