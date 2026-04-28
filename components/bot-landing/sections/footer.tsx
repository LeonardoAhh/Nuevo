"use client"

import Link from "next/link"
import { BookOpen, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BOT_WHATSAPP_URL, RECURSOS_URL, Reveal, RevealItem } from "../_shared"

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Reveal className="max-w-xl space-y-3">
          <RevealItem>
            <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Listo cuando lo necesites.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="text-pretty text-sm text-muted-foreground sm:text-base">
              Abre WhatsApp, envía tu número de empleado y recibe tu estatus al instante.
            </p>
          </RevealItem>
        </Reveal>

        <Reveal className="flex flex-wrap items-center gap-3">
          <RevealItem>
            <Button asChild size="icon" aria-label="Abrir en WhatsApp" title="Abrir en WhatsApp">
              <Link href={BOT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden />
              </Link>
            </Button>
          </RevealItem>
          <RevealItem>
            <Button asChild size="icon" variant="outline" aria-label="Ver cursos" title="Ver cursos">
              <Link href={RECURSOS_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen className="size-4" aria-hidden />
              </Link>
            </Button>
          </RevealItem>
        </Reveal>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Capacitación Planta Qro</p>
          <p className="text-center sm:text-right">
            Uso interno. Solo registramos el número del empleado para limitar a una consulta.
          </p>
        </div>
      </div>
    </footer>
  )
}
