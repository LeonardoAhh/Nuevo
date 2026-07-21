"use client"

import { motion } from "framer-motion"
import { Settings, Clock } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────
   MaintenanceScreen

   Pantalla de bloqueo completo mientras el sistema está en
   mantenimiento. Diseñada para usuarios internos de planta
   (operadores, supervisores, RRHH) — tono directo e industrial,
   sin dramatismo ni decoración superflua.

   Decisiones de diseño:
   - Un solo elemento animado (ícono central) — jerarquía clara.
   - Barra de progreso indeterminada como firma visual: comunica
     "trabajo en curso" sin necesidad de porcentajes falsos.
   - Fondo estático con patrón de puntos CSS — textura sin blur
     ni orbes que compiten con el contenido.
   - Cero colores hardcodeados: todo derivado de tokens del sistema.
   - font-mono para el eyebrow de estado, coherente con el resto
     de la plataforma (JetBrains Mono / Fira Code).
──────────────────────────────────────────────────────────────────── */

/* Estilos del patrón de fondo y la barra indeterminada —
   no pueden expresarse con Tailwind puro */
const STYLES = `
  /* Patrón de puntos — textura sutil que evoca malla industrial */
  .maint-bg-dots {
    background-image: radial-gradient(
      circle,
      hsl(var(--foreground) / 0.07) 1px,
      transparent 1px
    );
    background-size: 24px 24px;
  }

  /* Barra de progreso indeterminada */
  .maint-progress-track {
    width: 100%;
    height: 3px;
    background-color: hsl(var(--border));
    border-radius: 9999px;
    overflow: hidden;
  }

  .maint-progress-bar {
    height: 100%;
    width: 40%;
    background-color: hsl(var(--primary));
    border-radius: 9999px;
    animation: maintIndeterminate 2s ease-in-out infinite;
  }

  @keyframes maintIndeterminate {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  /* Pulso suave en el anillo del ícono */
  .maint-ring-pulse {
    animation: maintRingPulse 3s ease-in-out infinite;
  }

  @keyframes maintRingPulse {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%      { opacity: 0.3;  transform: scale(1.06); }
  }

  /* Respeta prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .maint-progress-bar  { animation: none; transform: translateX(125%); }
    .maint-ring-pulse    { animation: none; opacity: 0.15; }
  }
`

export function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <style>{STYLES}</style>

      {/* Patrón de fondo — estático, sin blur ni orbes */}
      <div className="maint-bg-dots absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* ── Ícono central ─────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 mb-10"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      >
        {/* Anillo exterior pulsante */}
        <div
          className="maint-ring-pulse absolute inset-0 rounded-full border border-primary"
          style={{ margin: "-12px" }}
          aria-hidden="true"
        />

        {/* Contenedor del ícono */}
        <div className="relative bg-card border border-border rounded-full p-7 shadow-sm">
          {/* Engrane girando — única animación de movimiento */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="text-primary"
            aria-hidden="true"
          >
            <Settings className="w-16 h-16 stroke-[1.25]" />
          </motion.div>

          {/* Badge de estado — esquina inferior derecha */}
          <div
            className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm"
            aria-hidden="true"
          >
            <Clock
              className="w-4 h-4"
              style={{ color: "hsl(var(--warning))" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Contenido de texto ────────────────────────────────────── */}
      <motion.div
        className="relative z-10 w-full max-w-sm space-y-3"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 120 }}
      >
        {/* Eyebrow — estado del sistema en mono */}
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Sistema en mantenimiento
        </p>

        {/* Título principal */}
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          Estamos aplicando una actualización.
        </h1>

        {/* Descripción */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          El sistema estará disponible en unos minutos.
        </p>

        {/* Barra de progreso indeterminada */}
        <div className="pt-4 pb-1">
          <div className="maint-progress-track" role="progressbar" aria-label="Actualización en progreso" aria-valuetext="Progreso indeterminado">
            <div className="maint-progress-bar" />
          </div>
        </div>

      </motion.div>
    </div>
  )
}
