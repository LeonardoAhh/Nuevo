import type { Metadata } from "next"
import { EventosLanding } from "@/components/eventos/eventos-landing"

export const metadata: Metadata = {
  title: "Mural de eventos — Capacitación Qro",
  description:
    "Galería pública de las celebraciones y eventos de la empresa. Explora las fotos, deja tu reseña y califica con estrellas.",
}

export default function EventosPage() {
  return <EventosLanding />
}
