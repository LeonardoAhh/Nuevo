import { DESEMPENO } from "@/lib/desempeno/presentation"
import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoPendientes from "@/components/content/desempeno-pendientes"

export const metadata: Metadata = {
  title: DESEMPENO.pages.pending.title,
}

export default function DesempenoPendientesPage() {
  return (
    <Dashboard
      pageTitle={DESEMPENO.pages.pending.title}
      content={<DesempenoPendientes />}
    />
  )
}
