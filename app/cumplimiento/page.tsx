import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ReportesContent from "@/components/content/reportes"

export const metadata: Metadata = {
    title: "Cumplimiento",
}

export default function CumplimientoPage() {
    return (
        <Dashboard
            pageTitle="Cumplimiento"
            content={<ReportesContent />}
        />
    )
}