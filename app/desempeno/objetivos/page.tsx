import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoObjetivos from "@/components/content/desempeno-objetivos"

export const metadata: Metadata = {
  title: "Objetivos Desempeño",
}

export default function DesempenoObjetivosPage() {
  return (
    <Dashboard
      pageTitle="Objetivos por puesto"
      content={<DesempenoObjetivos />}
    />
  )
}
