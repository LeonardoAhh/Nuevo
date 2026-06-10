"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"

export function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const handleControllerChange = () => setHasUpdate(true)
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
    }
  }, [])

  const handleUpdate = () => {
    setIsReloading(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes borderSpin {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .update-border {
          position: relative;
          border-radius: 1rem;
        }
        .update-border::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: inherit;
          background: conic-gradient(
            from var(--angle),
            hsl(var(--primary) / 0.15) 0%,
            hsl(var(--primary))         30%,
            hsl(var(--primary) / 0.15) 60%,
            hsl(var(--primary))         80%,
            hsl(var(--primary) / 0.15) 100%
          );
          animation: borderSpin 3s linear infinite;
          z-index: -1;
        }
        .update-border::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: inherit;
          z-index: -1;
        }
        .update-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .update-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: hsl(var(--primary-foreground) / 0.1);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .update-btn:hover::after  { opacity: 1; }
        .update-btn:active { transform: scale(0.96); }
        @media (prefers-reduced-motion: reduce) {
          .update-border::before { animation: none; }
        }
      `}</style>

      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{   y: 80, opacity: 0, scale: 0.96  }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-4 inset-x-0 mx-4 z-50 max-w-sm sm:mx-auto"
          >
            {/*
              Wrapper con borde animado.
              La capa de fondo está en ::after para que quede
              debajo del borde (::before) pero sobre el resto.
            */}
            <div
              className="update-border"
              style={{
                background: "hsl(var(--card))",
              }}
            >
              <div
                className="relative flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.06) 100%)",
                  boxShadow:
                    "0 8px 32px hsl(var(--primary) / 0.18), 0 2px 8px hsl(0 0% 0% / 0.12)",
                }}
              >
                {/* Icono */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-xl w-9 h-9"
                  style={{
                    background: "hsl(var(--primary) / 0.12)",
                    border: "1px solid hsl(var(--primary) / 0.25)",
                  }}
                >
                  <Sparkles
                    className="h-4 w-4"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                </div>

                {/* Texto */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className="font-semibold text-sm leading-tight"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Hay una nueva versión
                  </span>
                  <span
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Actualiza para aplicar los cambios.
                  </span>
                </div>

                {/* Botón */}
                <button
                  onClick={handleUpdate}
                  disabled={isReloading}
                  className="update-btn shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    boxShadow: "0 2px 8px hsl(var(--primary) / 0.35)",
                    opacity: isReloading ? 0.7 : 1,
                  }}
                >
                  {isReloading ? (
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="h-3 w-3 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Cargando…
                    </span>
                  ) : (
                    "Actualizar"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
