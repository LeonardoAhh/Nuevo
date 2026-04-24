"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BOT_WHATSAPP_URL, Eyebrow, fadeUp } from "../_shared"
import ChatPreview from "../chat-preview"

export default function Hero() {
  return (
    <header className="relative overflow-hidden">
      {/* Soft ambient glow that respects the theme tokens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.12),transparent_60%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-8 md:grid-cols-2 md:items-center md:pb-20 md:pt-20 lg:pt-24">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="space-y-6"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Eyebrow>Capacitación Qro · Bot de WhatsApp</Eyebrow>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Tu cumplimiento de capacitación, al instante por{" "}
            <span className="text-primary">WhatsApp</span>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Envía tu número de empleado y recibe en segundos los cursos que tienes al día,
            los que te faltan y tu porcentaje de cumplimiento.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Button asChild size="lg" className="gap-2">
              <Link href={BOT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden />
                Abrir en WhatsApp
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="#como-funciona">
                Cómo funciona
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid max-w-md grid-cols-3 gap-4 pt-6 text-left"
          >
            <Stat label="Respuesta" value="< 10s" />
            <Stat label="Disponible" value="24/7" />
            <Stat label="Por empleado" value="1 consulta" />
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative mx-auto w-full max-w-sm md:max-w-md"
        >
          <ChatPreview />
        </motion.div>
      </div>
    </header>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
    </div>
  )
}
