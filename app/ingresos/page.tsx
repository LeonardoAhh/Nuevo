"use client"

import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import NuevoIngresoContent from "@/components/content/nuevo-ingreso"

export const metadata: Metadata = {
  title: "Nuevo Ingreso",
}

export default function NuevoIngresoPage() {
  return (
    <Dashboard
      pageTitle="Nuevo Ingreso"
      content={<NuevoIngresoContent />}
    />
  )
}
