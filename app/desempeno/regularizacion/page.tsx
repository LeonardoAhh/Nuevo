import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import { RegularizacionContenido } from "@/components/content/desempeno/regularizacion/contenido"
import { DESEMPENO } from "@/lib/desempeno/presentation"

export const metadata: Metadata = { title: "Captura tardía | Evaluación de Desempeño" }

export default function RegularizacionPage() {
  return <Dashboard pageTitle="Captura tardía" headerTitleHref={DESEMPENO.routes.home} headerTitleHrefLabel="Volver a Evaluar" content={<RegularizacionContenido />} />
}
