"use client"

import Image from "next/image"

export default function HeroDashboard() {
  return (
    <div className="hero-dashboard relative w-full rounded-2xl overflow-hidden h-[200px] sm:h-[280px] md:h-[340px]">
      {/* Imagen de fondo con animación Ken Burns */}
      <div className="hero-image-wrapper absolute inset-0">
        <Image
          src="/HERO.png"
          alt="Hero"
          fill
          className="object-cover hero-zoom"
          loading="eager"
        />
      </div>

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Orbs flotantes */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 sm:px-12">
        <div className="hero-fade-up" style={{ animationDelay: "0ms" }}>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3 opacity-0 hero-fade-up-item" style={{ animationDelay: "100ms" }}>
            Bienvenido
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 opacity-0 hero-fade-up-item"
          style={{ animationDelay: "250ms" }}
        >
          VIÑOPLASTIC<br />
          <span className="text-primary">Planta Querétaro</span>
        </h1>
      </div>

      {/* Líneas decorativas animadas */}
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
        <div className="hero-grid" />
      </div>
    </div>
  )
}
