"use client"

import AmbientOrbs from "./ambient-orbs"
import ScrollProgress from "./scroll-progress"
import Hero from "./sections/hero"
import ComoFunciona from "./sections/como-funciona"
import ConsultarHoy from "./sections/consultar-hoy"
import Proximamente from "./sections/proximamente"
import RecursosBanner from "./sections/recursos-banner"
import Faq from "./sections/faq"
import Footer from "./sections/footer"

/**
 * Public marketing landing for the WhatsApp compliance bot.
 * Inherits the app's light / dark theme from the root layout.
 */
export default function BotLanding() {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground antialiased">
      <ScrollProgress />
      <AmbientOrbs />
      <Hero />
      <ComoFunciona />
      <ConsultarHoy />
      <RecursosBanner />
      <Proximamente />
      <Faq />
      <Footer />
    </main>
  )
}
