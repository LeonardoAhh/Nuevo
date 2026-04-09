"use client"

import Dashboard from "@/components/Dashboard"
import PortfolioContent from "@/components/content/portfolio"

export default function PortfolioPage() {
  return (
    <Dashboard
      pageTitle="Portfolio"
      content={<PortfolioContent />}
    />
  )
}
