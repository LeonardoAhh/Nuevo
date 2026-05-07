"use client"

import Image from "next/image"

/**
 * LoginHero — Viñoplastic · Planta Querétaro
 * Rediseño drop-in: 100% CSS (sin framer-motion).
 *
 * Concepto: \"Vinería Industrial\" — herencia editorial del vino (serif
 * Fraunces, sello de añada, número de lote) cruzada con la precisión
 * de una planta de producción (mono JetBrains, coordenadas, beam de
 * escaneo y reticulado fino).
 *
 * Cromática: ancla en `--primary`. Todos los acentos derivan de él
 * mediante `color-mix` y `hsl(from ...)` para mantener cohesión con
 * el tema de la app (light/dark).
 */
export default function LoginHero() {
    return (
        <div className="vp-hero">
            <div className="vp-base" aria-hidden />
            <div className="vp-conic" aria-hidden />

            <span className="vp-orb vp-orb--a" aria-hidden />
            <span className="vp-orb vp-orb--b" aria-hidden />
            <span className="vp-orb vp-orb--c" aria-hidden />
            <span className="vp-beam" aria-hidden />
            <div className="vp-grid" aria-hidden />
            <div className="vp-grain" aria-hidden />

            {/* ───────── Núcleo central ───────── */}
            <div className="vp-core">
                {/* Sello de añada / número de serie */}
                <div className="vp-stamp">
                    <span className="vp-stamp__line" />
                    <span className="vp-stamp__num">Desde 1970</span>
                    <span className="vp-stamp__line" />
                </div >

                {/* Wordmark editorial */}
                <h2 className="vp-title">
                    <span className="vp-title__a">VIÑO</span>
                    <span className="vp-title__b">PLASTIC</span>
                </h2>

                {/* Filete decorativo */}
                <div className="vp-rule" aria-hidden>
                    <span /><em>·</em> <span />
                </div>

                {/* Subtítulo */}
                <p className="vp-sub">
                    <i>Planta</i>&nbsp;Querétaro
                </p>
            </div>

            {/* ───────── Curva lateral derecha (solo desktop) ───────── */}
            <div className="vp-curve" aria-hidden>
                <svg
                    viewBox="0 0 80 900"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M80 0H0C40 150 0 300 40 450C80 600 0 750 40 900H80V0Z"
                        className="fill-background"
                    />
                </svg>
            </div>

            {/* ───────── Estilos locales ───────── */}
            < style jsx > {`
        @import url(\"https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,800;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600&display=swap\");

        /* ============================================================
           Variables locales — todas derivan de --primary del tema
           ============================================================ */
        .vp-hero {
          --p: var(--primary, 345 65% 28%);
          --p-deep: hsl(var(--p) / 1);
          --p-mid: hsl(var(--p) / 0.55);
          --p-soft: hsl(var(--p) / 0.18);
          --ink: color-mix(in oklab, hsl(var(--p)) 78%, #06030a 22%);
          --ink-deep: color-mix(in oklab, hsl(var(--p)) 35%, #050207 65%);
          --gold: hsl(38 78% 68%);
          --gold-soft: hsl(38 78% 68% / 0.35);
          --line: rgba(255, 255, 255, 0.09);
          --line-strong: rgba(255, 255, 255, 0.22);
          --text: rgba(255, 255, 255, 0.96);
          --text-mute: rgba(255, 255, 255, 0.62);
          --text-faint: rgba(255, 255, 255, 0.38);

          position: relative;
          height: 100%;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
          color: var(--text);
          font-family: \"Manrope\", system-ui, sans-serif;
          background: var(--ink-deep);
        }

        /* ============================================================
           Capa 0 · base + halo cónico
           ============================================================ */
        .vp-base {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 80% at 50% 20%, var(--ink) 0%, transparent 60%),
            radial-gradient(80% 60% at 80% 100%, var(--p-soft) 0%, transparent 70%),
            linear-gradient(180deg, var(--ink-deep) 0%, #050309 100%);
        }
        .vp-conic {
          position: absolute;
          inset: -25%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            hsl(var(--p) / 0.35) 60deg,
            transparent 140deg,
            hsl(var(--p) / 0.22) 220deg,
            transparent 300deg,
            hsl(var(--p) / 0.35) 360deg
          );
          filter: blur(70px);
          opacity: 0.55;
          mix-blend-mode: screen;
          animation: vp-spin 38s linear infinite;
        }

        /* ============================================================
           Capa 1 · orbes
           ============================================================ */
        .vp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          mix-blend-mode: screen;
          opacity: 0.85;
          will-change: transform;
        }
        .vp-orb--a {
          width: 32rem;
          height: 32rem;
          left: -8rem;
          top: -10rem;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.95), transparent 70%);
          animation: vp-drift-a 18s ease-in-out infinite;
        }
        .vp-orb--b {
          width: 26rem;
          height: 26rem;
          right: -6rem;
          bottom: -8rem;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.7) 0%, var(--gold-soft) 60%, transparent 80%);
          animation: vp-drift-b 22s ease-in-out infinite;
        }
        .vp-orb--c {
          width: 18rem;
          height: 18rem;
          left: 55%;
          top: 60%;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.55), transparent 70%);
          animation: vp-drift-c 26s ease-in-out infinite;
        }

        /* ============================================================
           Capa 2 · beam diagonal
           ============================================================ */
        .vp-beam {
          position: absolute;
          inset: -20% -40%;
          background: linear-gradient(
            115deg,
            transparent 40%,
            rgba(255, 255, 255, 0.06) 48%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(255, 255, 255, 0.06) 52%,
            transparent 60%
          );
          animation: vp-beam 9s ease-in-out infinite;
          pointer-events: none;
        }

        /* ============================================================
           Capa 3 · grid técnico
           ============================================================ */
        .vp-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--line) 1px, transparent 1px),
            linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 80%);
          opacity: 0.5;
        }

        /* ============================================================
           Capa 4 · grano (SVG fractalNoise data-uri)
           ============================================================ */
        .vp-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\");
          background-size: 200px 200px;
        }

        /* ============================================================
           Tags perimetrales
           ============================================================ */
        .vp-tag {
          position: absolute;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: \"JetBrains Mono\", ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.18em;
          color: var(--text-faint);
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .vp-tag--tl { top: 1.25rem; left: 1.25rem; }
        .vp-tag--tr { top: 1.25rem; right: 2.75rem; }
        .vp-tag--bl { bottom: 1.25rem; left: 1.25rem; }
        .vp-tag--br { bottom: 1.25rem; right: 2.75rem; }

        .vp-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 0 2px hsl(38 78% 68% / 0.18), 0 0 12px var(--gold);
          animation: vp-pulse 2.4s ease-in-out infinite;
        }

        @media (max-width: 1023px) {
          .vp-tag--tr, .vp-tag--br { right: 1.25rem; }
          .vp-tag { font-size: 0.55rem; }
        }
        @media (max-width: 640px) {
          .vp-tag--tr, .vp-tag--bl { display: none; }
        }

        /* ============================================================
           Marcador vertical
           ============================================================ */
        .vp-vertical {
          position: absolute;
          left: 1.5rem;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);
          transform-origin: left center;
          font-family: \"JetBrains Mono\", ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.4em;
          color: var(--text-faint);
          z-index: 5;
          white-space: nowrap;
        }
        @media (max-width: 1023px) { .vp-vertical { display: none; } }

        /* ============================================================
           Núcleo
           ============================================================ */
        .vp-core {
          position: relative;
          z-index: 6;
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          animation: vp-rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── Sello de añada ─────────────────────────────────────── */
        .vp-stamp {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          animation: vp-fade 1.4s 0.05s ease-out both;
        }
        .vp-stamp__line {
          height: 1px;
          width: 2.5rem;
          background: linear-gradient(90deg, transparent, var(--gold-soft), transparent);
        }
        .vp-stamp__num {
          font-family: \"JetBrains Mono\", ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.35em;
          color: var(--gold);
        }

        /* ── Stage del logo (arco + halo + crucetas) ────────────── */
        .vp-logo-stage {
          position: relative;
          width: 9rem;
          height: 9rem;
          display: grid;
          place-items: center;
          margin-bottom: 1.75rem;
          animation: vp-zoom 1.1s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (min-width: 640px)  { .vp-logo-stage { width: 11rem; height: 11rem; } }
        @media (min-width: 1024px) { .vp-logo-stage { width: 13.5rem; height: 13.5rem; } }

        .vp-arch {
          position: absolute;
          inset: 0;
          border-radius: 50% 50% 12% 12% / 60% 60% 8% 8%;
          background:
            linear-gradient(180deg, hsl(var(--p) / 0.35), hsl(var(--p) / 0.05) 60%, transparent),
            radial-gradient(closest-side, rgba(255, 255, 255, 0.06), transparent 70%);
          border: 1px solid var(--line-strong);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            inset 0 -40px 60px hsl(var(--p) / 0.25),
            0 30px 60px -20px rgba(0, 0, 0, 0.6);
        }
        .vp-halo {
          position: absolute;
          inset: -25%;
          border-radius: 50%;
          background: radial-gradient(closest-side, hsl(var(--p) / 0.55), transparent 70%);
          filter: blur(30px);
          animation: vp-halo 4s ease-in-out infinite;
        }
        .vp-logo {
          position: relative;
          width: 70%;
          height: 70%;
          z-index: 2;
          animation: vp-float 6s ease-in-out infinite;
          filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.55))
                  drop-shadow(0 0 24px hsl(var(--p) / 0.45));
        }
        :global(.vp-logo__img) {
          object-fit: contain;
        }

        .vp-cross {
          position: absolute;
          width: 14px;
          height: 14px;
          z-index: 3;
          opacity: 0.55;
        }
        .vp-cross::before, .vp-cross::after {
          content: \"\";
          position: absolute;
          background: var(--gold);
        }
        .vp-cross::before { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
        .vp-cross::after  { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
        .vp-cross--tl { top: 4px;    left: 4px;    }
        .vp-cross--tr { top: 4px;    right: 4px;   }
        .vp-cross--bl { bottom: 4px; left: 4px;    }
        .vp-cross--br { bottom: 4px; right: 4px;   }

        /* ── Wordmark ───────────────────────────────────────────── */
        .vp-title {
          font-family: \"Fraunces\", \"Cormorant Garamond\", Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 600;
          font-size: clamp(2rem, 4.5vw, 3.6rem);
          line-height: 1;
          letter-spacing: -0.01em;
          color: var(--text);
          margin: 0;
          text-shadow: 0 2px 24px hsl(var(--p) / 0.45);
          animation: vp-fade 1.2s 0.3s ease-out both;
        }
        .vp-title__a {
          font-style: italic;
          font-weight: 300;
          color: var(--gold);
        }
        .vp-title__b {
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        /* ── Filete decorativo ──────────────────────────────────── */
        .vp-rule {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin: 0.85rem 0 0.35rem;
          color: var(--gold);
          animation: vp-fade 1.2s 0.45s ease-out both;
        }
        .vp-rule span {
          height: 1px;
          width: 2.5rem;
          background: linear-gradient(90deg, transparent, var(--gold-soft), var(--gold), var(--gold-soft), transparent);
        }
        .vp-rule em {
          font-style: normal;
          font-size: 0.7rem;
          opacity: 0.8;
        }

        /* ── Subtítulo ──────────────────────────────────────────── */
        .vp-sub {
          margin: 0;
          font-family: \"Fraunces\", Georgia, serif;
          font-size: clamp(1rem, 1.6vw, 1.25rem);
          color: var(--text-mute);
          letter-spacing: 0.04em;
          animation: vp-fade 1.2s 0.55s ease-out both;
        }
        .vp-sub i {
          font-style: italic;
          color: var(--text);
        }

        /* ── Pill Vertx System ──────────────────────────────────── */
        .vp-pill {
          margin-top: 1.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-family: \"JetBrains Mono\", ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--text-mute);
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform .35s ease, border-color .35s ease, color .35s ease;
          animation: vp-fade 1.2s 0.7s ease-out both;
        }
        .vp-pill:hover {
          transform: translateY(-1px);
          border-color: var(--gold-soft);
          color: var(--text);
        }
        .vp-pill__pulse {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6);
          animation: vp-status 2s ease-out infinite;
        }

        /* ============================================================
           Curva lateral derecha (igual al original)
           ============================================================ */
        .vp-curve {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 4rem;
          overflow: hidden;
          z-index: 7;
          display: none;
        }
        @media (min-width: 1024px) { .vp-curve { display: block; } }
        @media (min-width: 1280px) { .vp-curve { width: 5rem; } }
        .vp-curve svg { height: 100%; width: 100%; }

        /* ============================================================
           Keyframes
           ============================================================ */
        @keyframes vp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vp-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes vp-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, -25px) scale(1.06); }
        }
        @keyframes vp-drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-20px, 35px) scale(1.04); }
        }
        @keyframes vp-beam {
          0%, 100% { transform: translateX(-30%); opacity: 0; }
          45%      { opacity: 1; }
          55%      { opacity: 1; }
          100%     { transform: translateX(40%); opacity: 0; }
        }
        @keyframes vp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.9); }
        }
        @keyframes vp-halo {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.08); }
        }
        @keyframes vp-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes vp-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vp-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vp-zoom {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes vp-status {
          0%   { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.55); }
          70%  { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          .vp-conic, .vp-orb, .vp-beam, .vp-halo, .vp-logo,
          .vp-dot, .vp-pill__pulse, .vp-core, .vp-stamp,
          .vp-title, .vp-rule, .vp-sub, .vp-pill, .vp-logo-stage {
            animation: none !important;
          }
        }
      `}</style >
        </div >
    )
}
