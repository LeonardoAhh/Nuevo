"use client"

import { MessageCircle, Send, ListChecks } from "lucide-react"
import { Eyebrow, Reveal, RevealItem, Section } from "../_shared"

const STEPS = [
  {
    icon: MessageCircle,
    n: "01",
    title: "Abre WhatsApp",
    body: "Inicia una conversación con el bot desde tu celular. No necesitas instalar nada ni crear cuenta.",
  },
  {
    icon: Send,
    n: "02",
    title: "Envía tu número",
    body: "Escribe tu número de empleado (solo dígitos). El bot valida el formato y responde al instante.",
  },
  {
    icon: ListChecks,
    n: "03",
    title: "Revisa tu estatus",
    body: "Recibirás tu porcentaje de cumplimiento, cursos completados y los que te faltan por tomar.",
  },
]

export default function ComoFunciona() {
  return (
    <Section id="como-funciona">
      <Reveal className="max-w-2xl space-y-3">
        <RevealItem>
          <Eyebrow>Cómo funciona</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Tres pasos. Sin fricciones.
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="text-pretty text-muted-foreground sm:text-lg">
            Pensado para que cualquier empleado pueda consultar su cumplimiento sin pedir
            apoyo al departamento.
          </p>
        </RevealItem>
      </Reveal>

      <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <RevealItem key={s.n}>
            <article className="group relative flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground/80">
                  {s.n}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  )
}
