"use client"

import {
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Images,
  type LucideIcon,
} from "lucide-react"
import { Eyebrow, Reveal, RevealItem, Section } from "../_shared"

const ROADMAP: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: Images,
    title: "Mural de Eventos",
    body: "Galería con fotos de los eventos realizados dentro de la empresa.",
  },
  {
    icon: CalendarDays,
    title: "Días festivos y no laborables",
    body: "Notificaciones oportunas para que sepas qué días descansa la planta.",
  },
  {
    icon: ShieldCheck,
    title: "Turno con 0 faltas",
    body: "Reconocimiento automático al turno que cierra la semana sin ausencias.",
  },
  {
    icon: PartyPopper,
    title: "Cumpleaños del mes",
    body: "Lista compartida para celebrar a los compañeros que cumplen años.",
  },
  {
    icon: CalendarHeart,
    title: "Aniversarios",
    body: "Felicita a quienes cumplen un año más con la empresa.",
  },
  {
    icon: CalendarRange,
    title: "Próximos eventos",
    body: "Agenda de eventos internos para que nadie se pierda ninguno.",
  },
]

export default function Proximamente() {
  return (
    <Section>
      <Reveal className="max-w-2xl space-y-3">
        <RevealItem>
          <Eyebrow>Próximamente</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            En el roadmap.
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="text-pretty text-muted-foreground sm:text-lg">
            Lo que estamos integrando al bot para que la planta esté siempre conectada.
          </p>
        </RevealItem>
      </Reveal>

      <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((r) => (
          <RevealItem key={r.title}>
            <article className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/60 p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3" aria-hidden />
                  En plan
                </span>
              </div>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{r.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </article>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  )
}
