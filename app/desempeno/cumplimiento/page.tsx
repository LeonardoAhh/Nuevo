import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoCumplimientoContent from "@/components/content/desempeno-cumplimiento"

export const metadata: Metadata = {
  title: "Cumplimiento Evaluaciones",
}

export default function DesempenoCumplimientoPage() {
  return (
    <Dashboard
      pageTitle="Cumplimiento de Evaluaciones"
      content={<DesempenoCumplimientoContent />}
    />
  )
}
