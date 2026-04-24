"use client"

import Link from "next/link"
import { ArrowUpRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RECURSOS_URL, Reveal, RevealItem, Section } from "../_shared"

/**
 * Cross-promo banner pointing to the public `/recursos` page.
 * Kept visually distinct from neighbouring sections via a subtle tinted
 * background that stays inside theme tokens.
 */
export default function RecursosBanner() {
  return (
    <Section className="!py-10 sm:!py-12">
      <Reveal>
        <RevealItem>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                  <BookOpen className="size-3.5" aria-hidden />
                  Catálogo de cursos
                </span>
                <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  ¿Te falta un curso? Explora el catálogo.
                </h2>
                <p className="text-pretty text-sm text-muted-foreground sm:text-base">
                  Consulta los cursos disponibles, lee la descripción y encuentra cómo
                  ponerte al día. Sin login, abierto para todos los empleados.
                </p>
              </div>

              <Button asChild size="lg" className="gap-2 self-start md:self-auto">
                <Link href={RECURSOS_URL} target="_blank" rel="noopener noreferrer">
                  Ir a /recursos
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </RevealItem>
      </Reveal>
    </Section>
  )
}
