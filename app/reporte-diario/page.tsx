import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ReporteDiarioContent from "@/components/content/reporte-diario"

export const metadata: Metadata = {
    title: "Reporte Diario",
}

export default function ReporteDiarioPage() {
    return (
        <Dashboard pageTitle="Reporte Diario" content={<ReporteDiarioContent />} />
    )
}
