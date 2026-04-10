"use client"

import Image from "next/image"

export default function LoginHero() {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center login-hero-bg">
      {/* ── Gradient base (usa --primary para cohesión con el tema) ── */}
      <div className="absolute inset-0 login-aurora" />

      {/* ── Mesh / Noise overlay ── */}
      <div className="absolute inset-0 login-grain opacity-[0.03] dark:opacity-[0.05]" />

      {/* ── Orbs animados (colores derivan de --primary) ── */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* ── Grid decorativo ── */}
      <div className="absolute inset-0 login-grid-overlay opacity-[0.06] dark:opacity-[0.08]" />

      {/* ── Contenido central ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-12 lg:px-16 max-w-lg pb-8 lg:pb-0">
        {/* Logo */}
        <div className="login-logo-entrance mb-4 lg:mb-8">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 login-logo-float">
            <Image
              src="/logo-vino-plastic.png"
              alt="Viñoplastic"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight login-fade-up" style={{ animationDelay: "400ms" }}>
          VIÑOPLASTIC
        </h2>
        <p className="text-base sm:text-lg lg:text-xl font-medium text-white/80 mt-1 login-fade-up" style={{ animationDelay: "550ms" }}>
          Planta Querétaro
        </p>

        <div className="mt-4 lg:mt-8 login-fade-up" style={{ animationDelay: "700ms" }}>
          <span className="inline-block text-[0.65rem] sm:text-sm font-semibold uppercase tracking-[0.25em] text-white/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/15 backdrop-blur-sm bg-white/5">
            Vertx System v2.0
          </span>
        </div>
      </div>

      {/* ── Curva lateral derecha (solo desktop) ── */}
      <div className="absolute top-0 right-0 bottom-0 hidden lg:block w-16 xl:w-20 overflow-hidden">
        <svg viewBox="0 0 80 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" preserveAspectRatio="none">
          <path d="M80 0H0C40 150 0 300 40 450C80 600 0 750 40 900H80V0Z" className="fill-background" />
        </svg>
      </div>
    </div>
  )
}
