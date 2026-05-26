import type { Metadata } from "next"
import { GuiaEvaluadorPage } from "@/components/guia-evaluador/guia-evaluador-page"

export const metadata: Metadata = {
  title: "Guía del Evaluador · Viñoplastic",
  description:
    "Guía pública para evaluadores: acceso al sistema, vista de desempeño, cómo evaluar, guardar e imprimir evaluaciones.",
}

export default function Page() {
  return <GuiaEvaluadorPage />
}
