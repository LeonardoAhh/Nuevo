"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StarRating } from "./star-rating"

/** Minimum seconds before the submit button is enabled — basic anti-bot. */
const MIN_TIME_SECS = 3

interface Props {
  onSubmit: (input: { nombre: string; rating: number; comentario?: string }) => Promise<void>
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export function ResenaForm({ onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const [nombre, setNombre] = useState("")
  const [rating, setRating] = useState(0)
  const [comentario, setComentario] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secsLeft, setSecsLeft] = useState(MIN_TIME_SECS)
  const mountedAt = useRef<number>(Date.now())

  useEffect(() => {
    mountedAt.current = Date.now()
    const tick = () => {
      const elapsed = (Date.now() - mountedAt.current) / 1000
      setSecsLeft(Math.max(0, MIN_TIME_SECS - elapsed))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [])

  const tooFast = secsLeft > 0

  // Step 1 valid → can advance
  const step1Valid = nombre.trim().length >= 2 && rating >= 1 && rating <= 5

  // Step 2 submit disabled
  const submitDisabled = submitting || tooFast || !step1Valid

  function goToStep2() {
    if (!step1Valid) return
    setDirection(1)
    setStep(2)
  }

  function goToStep1() {
    setDirection(-1)
    setStep(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (honeypot.length > 0) {
      // silently swallow bots
      setNombre("")
      setComentario("")
      setRating(0)
      setStep(1)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        nombre: nombre.trim(),
        rating,
        comentario: comentario.trim() || undefined,
      })
      setNombre("")
      setComentario("")
      setRating(0)
      setStep(1)
      mountedAt.current = Date.now()
      setSecsLeft(MIN_TIME_SECS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al publicar reseña")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border/60 bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Deja tu reseña</p>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === 1 ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
          <span
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === 2 ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        </div>
      </div>

      {/* Honeypot — hidden from real users, bots may fill it */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {step === 1 ? (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="resena-nombre" className="text-xs text-muted-foreground">
                Tu nombre
              </Label>
              <Input
                id="resena-nombre"
                placeholder="Ej. Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={60}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Calificación</Label>
              <div className="flex h-9 items-center">
                <StarRating value={rating} onChange={setRating} size={24} />
                {rating > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={goToStep2}
                disabled={!step1Valid}
                size="icon"
                aria-label="Siguiente"
                title="Siguiente"
              >
                <ArrowRight size={14} />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {/* Summary pill */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium truncate">{nombre}</span>
              <span className="text-muted-foreground">·</span>
              <StarRating value={rating} size={12} readOnly />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resena-comentario" className="text-xs text-muted-foreground">
                Comentario (opcional)
              </Label>
              <Textarea
                id="resena-comentario"
                rows={3}
                placeholder="Cuéntanos qué te pareció el evento..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={2000}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">{comentario.length}/2000</p>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goToStep1}
                aria-label="Atrás"
                title="Atrás"
              >
                <ArrowLeft size={14} />
              </Button>

              <div className="flex items-center gap-2">
                {tooFast && (
                  <span className="text-xs text-muted-foreground">
                    Espera {Math.ceil(secsLeft)}s
                  </span>
                )}
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button type="submit" disabled={submitDisabled} size="icon" aria-label="Publicar" title="Publicar">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
