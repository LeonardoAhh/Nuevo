"use client"

import { motion } from "framer-motion"
import { BarChart3, Briefcase, CheckCircle2, AlertTriangle } from "lucide-react"
import { Eyebrow, Reveal, RevealItem, Section } from "../_shared"

const FEATURES = [
  {
    icon: BarChart3,
    title: "Porcentaje de cumplimiento",
    body: "Ve en segundos qué tanto has avanzado contra el total requerido para tu puesto.",
  },
  {
    icon: CheckCircle2,
    title: "Cursos completados",
    body: "Lista detallada de todos los cursos que ya tienes aprobados y registrados.",
  },
  {
    icon: AlertTriangle,
    title: "Cursos pendientes",
    body: "Identifica qué cursos te faltan por tomar para estar al 100 %.",
  },
  {
    icon: Briefcase,
    title: "Puesto y departamento",
    body: "Valida que tu información de posición está registrada correctamente.",
  },
]

export default function ConsultarHoy() {
  return (
    <Section>
      <Reveal className="max-w-2xl space-y-3">
        <RevealItem>
          <Eyebrow>Lo que puedes consultar hoy</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Datos claros, sin trámites.
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="text-pretty text-muted-foreground sm:text-lg">
            Cada respuesta combina la información del sistema de capacitación con los cursos
            requeridos para tu puesto.
          </p>
        </RevealItem>
      </Reveal>

      <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <RevealItem key={f.title}>
            <motion.article
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <motion.span
                whileHover={{ rotate: -4, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"
              >
                <f.icon className="size-5" strokeWidth={1.75} aria-hidden />
              </motion.span>
              <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.article>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  )
}
