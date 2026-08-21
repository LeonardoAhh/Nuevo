"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckIcon } from "lucide-react"

export function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [status, setStatus] = useState<"idle" | "success">("idle")

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    let registration: ServiceWorkerRegistration | undefined;

    const onUpdateFound = () => {
      const installingWorker = registration?.installing
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            setHasUpdate(true)
          }
        }
      }
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return
      registration = reg

      if (reg.waiting) {
        setHasUpdate(true)
      }

      reg.addEventListener("updatefound", onUpdateFound)
    })

    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

    return () => {
      if (registration) {
        registration.removeEventListener("updatefound", onUpdateFound)
      }
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
    }
  }, [])

  const handleUpdate = async () => {
    setStatus("success")
    // Wait for the animation to play before reloading
    await new Promise(resolve => setTimeout(resolve, 1000))

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" })
      } else {
        window.location.reload()
      }
    })
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0,  opacity: 1, scale: 1    }}
              exit={{   y: 20, opacity: 0, scale: 0.96  }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-full max-w-sm"
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
                  disabled={status !== "idle"}
                  className="update-btn shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center justify-center min-w-[90px]"
                  style={{
                    background: status === "success" ? "hsl(var(--success))" : "hsl(var(--primary))",
                    color: status === "success" ? "hsl(var(--success-foreground))" : "hsl(var(--primary-foreground))",
                    boxShadow: status === "success" ? "none" : "0 2px 8px hsl(var(--primary) / 0.35)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <AnimatePresence mode="wait">
                    {status === "success" ? (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex items-center gap-1.5"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        ¡Listo!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        Actualizar
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
