import type { Metadata } from "next"
import BotLanding from "@/components/bot-landing/bot-landing"

export const metadata: Metadata = {
  title: "Bot de WhatsApp — Capacitación Qro",
  description:
    "Consulta tu cumplimiento de capacitación directamente por WhatsApp. Envía tu número de empleado y recibe el estatus de tus cursos al instante.",
}

export default function BotLandingPage() {
  return <BotLanding />
}
