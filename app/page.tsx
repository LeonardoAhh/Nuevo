import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DashboardHome from "@/components/dashboard-home"

export const metadata: Metadata = {
  title: "Dashboard | Capacitación Qro",
}

export default function Page() {
  return <Dashboard pageTitle="Dashboard" content={<DashboardHome />} />
}
