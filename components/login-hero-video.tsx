"use client"

import { useCallback, useRef, useState } from "react"
import LoginHero from "./login-hero"

/**
 * LoginHeroVideo — panel izquierdo (desktop) / superior (móvil) del login.
 *
 * Reproduce uno o varios videos a pantalla completa dentro del panel.
 * Las rutas NO están hardcodeadas: se leen de la variable de entorno
 * pública `NEXT_PUBLIC_LOGIN_VIDEOS` (lista separada por comas, relativa
 * a /public). Si la variable está vacía, hace fallback al arte CSS
 * original (LoginHero) para no romper nada.
 *
 * Ejemplos:
 *   NEXT_PUBLIC_LOGIN_VIDEOS=/login-video.mp4
 *   NEXT_PUBLIC_LOGIN_VIDEOS=/videos/a.mp4,/videos/b.mp4
 */
const VIDEOS = (process.env.NEXT_PUBLIC_LOGIN_VIDEOS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

const POSTER = process.env.NEXT_PUBLIC_LOGIN_VIDEO_POSTER?.trim() || undefined

export default function LoginHeroVideo() {
    if (VIDEOS.length === 0) {
        return <LoginHero />
    }
    return <VideoStage sources={VIDEOS} poster={POSTER} />
}

function VideoStage({ sources, poster }: { sources: string[]; poster?: string }) {
    const [index, setIndex] = useState(0)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const single = sources.length === 1

    const handleEnded = useCallback(() => {
        if (single) return
        setIndex((i) => (i + 1) % sources.length)
    }, [single, sources.length])

    return (
        <div className="lhv-stage">
            <video
                ref={videoRef}
                key={sources[index]}
                className="lhv-video"
                src={sources[index]}
                poster={poster}
                autoPlay
                muted
                loop={single}
                playsInline
                preload="auto"
                onEnded={handleEnded}
                aria-hidden
            />

            {/* Velos para legibilidad y transición hacia el formulario */}
            <div className="lhv-veil" aria-hidden />
            <div className="lhv-veil-bottom" aria-hidden />

            {/* Curva lateral derecha (solo desktop) — empata con el diseño previo */}
            <div className="lhv-curve" aria-hidden>
                <svg viewBox="0 0 80 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M80 0H0C40 150 0 300 40 450C80 600 0 750 40 900H80V0Z"
                        className="fill-background"
                    />
                </svg>
            </div>

            <style jsx>{`
        .lhv-stage {
          position: relative;
          height: 100%;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
          background: hsl(var(--primary, 345 65% 28%) / 0.9);
        }
        .lhv-video {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        /* velo sutil para que se sienta integrado con el tema */
        .lhv-veil {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(0, 0, 0, 0.18) 100%),
            linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.28) 100%);
          pointer-events: none;
        }
        /* refuerzo en la base: en móvil el formulario sube con borde redondeado */
        .lhv-veil-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 28%;
          background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.35));
          pointer-events: none;
        }
        .lhv-curve {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 4rem;
          overflow: hidden;
          z-index: 2;
          display: none;
        }
        .lhv-curve svg {
          height: 100%;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .lhv-curve {
            display: block;
          }
        }
        @media (min-width: 1280px) {
          .lhv-curve {
            width: 5rem;
          }
        }
      `}</style>
        </div>
    )
}
