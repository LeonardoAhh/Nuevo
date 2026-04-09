"use client"

import Dashboard from "@/components/dashboard"
import NuevoIngresoContent from "@/components/content/nuevo-ingreso"

export default function NuevoIngresoPage() {
  return (
    <Dashboard
      pageTitle="Nuevo Ingreso"
      content={<NuevoIngresoContent />}
    />
  )
}
