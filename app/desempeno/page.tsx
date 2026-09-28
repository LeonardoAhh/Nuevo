import { DESEMPENO } from "@/lib/desempeno/presentation"
import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoSearch from "@/components/content/desempeno-search"

export const metadata: Metadata = {
  title: DESEMPENO.title,
}

export default function DesempenoPage() {
  return (
    <Dashboard
      pageTitle={DESEMPENO.title}
      content={<DesempenoSearch />}
    />
  )
}
