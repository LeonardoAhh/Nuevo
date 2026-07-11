import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import AusentismoSection from "@/components/content/reporte-diario/ausentismo-section"

export const metadata: Metadata = {
    title: "Ranking de Ausentismo",
}

export default function AusentismoPage() {
    return (
        <Dashboard pageTitle="Ranking de Ausentismo" content={<AusentismoSection />} />
    )
}
