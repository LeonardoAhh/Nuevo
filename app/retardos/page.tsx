import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import RetardosSection from "@/components/content/retardos/retardos-section"

export const metadata: Metadata = {
    title: "Retardos y Marcajes",
}

export default function RetardosPage() {
    return (
        <Dashboard pageTitle="Retardos y Marcajes" content={<RetardosSection />} />
    )
}
