import { DESEMPENO } from "@/lib/desempeno/presentation"
import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoObjetivos from "@/components/content/desempeno-objetivos"

export const metadata: Metadata = {
  title: DESEMPENO.pages.saved.title,
}

export default function DesempenoObjetivosPage() {
  return (
    <Dashboard
      pageTitle={DESEMPENO.pages.saved.title}
      content={<DesempenoObjetivos />}
    />
  )
}
