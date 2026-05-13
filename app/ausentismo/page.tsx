import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import AusentismoSection from "@/components/content/reporte-diario/ausentismo-section"

export const metadata: Metadata = {
    title: "Ausentismo e Incidencias",
}

export default function AusentismoPage() {
    return (
        <Dashboard pageTitle="Ausentismo e Incidencias" content={<AusentismoSection />} />
    )
}
