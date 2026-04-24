"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Eyebrow, Reveal, RevealItem, Section } from "../_shared"

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Cuántas veces puedo consultar?",
    a: "Por ahora cada empleado tiene una sola consulta activa. Esto nos ayuda a prevenir abuso y mantener la información clara. En el futuro evaluaremos permitir consultas adicionales.",
  },
  {
    q: "¿Qué hago si mis datos están mal?",
    a: "Acércate al Departamento de Capacitación en planta. Ellos pueden verificar y corregir tu puesto, departamento o registros de cursos.",
  },
  {
    q: "¿Qué pasa si no tengo número de empleado?",
    a: "El bot necesita tu número para identificarte. Si no lo sabes, consulta con Recursos Humanos o con tu jefe directo antes de usar el bot.",
  },
  {
    q: "¿Guardan mis mensajes?",
    a: "Solo registramos que realizaste una consulta (número y teléfono) para limitarla a una vez. No almacenamos el contenido del chat ni lo compartimos fuera del área.",
  },
]

export default function Faq() {
  return (
    <Section>
      <Reveal className="max-w-2xl space-y-3">
        <RevealItem>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Lo que más nos preguntan.
          </h2>
        </RevealItem>
      </Reveal>

      <Reveal className="mt-10 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
        {FAQS.map((item, i) => (
          <RevealItem key={i}>
            <FaqRow {...item} />
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  )
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground sm:text-base">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
              {a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
