"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
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
    body: "Lee tu resultado al instante, directo en el chat. Sin esperas ni formularios.",
  },
]

export default function ComoFunciona() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 60%"],
  })
  // Animated progress line that "draws" itself from left to right as the
  // section scrolls into view, tying the three steps together.
  const lineScale = useTransform(scrollYProgress, [0, 0.85], [0, 1])

  return (
    <div ref={ref}>
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

        <div className="relative mt-12">
          {/* Connecting progress line behind the cards, only visible on lg+ */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-16 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />
          <motion.div
            aria-hidden
            style={{ scaleX: lineScale }}
            className="pointer-events-none absolute inset-x-8 top-16 hidden h-px origin-left bg-gradient-to-r from-transparent via-primary to-transparent lg:block"
          />

          <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <RevealItem key={s.n}>
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <motion.span
                      initial={{ scale: 0, rotate: -25 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 18,
                        delay: 0.15 + i * 0.12,
                      }}
                      whileHover={{ rotate: -4, scale: 1.05 }}
                      className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    >
                      <s.icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.45, delay: 0.25 + i * 0.12 }}
                      className="text-sm font-semibold tabular-nums text-muted-foreground/80"
                    >
                      {s.n}
                    </motion.span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </motion.article>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>
    </div>
  )
}
