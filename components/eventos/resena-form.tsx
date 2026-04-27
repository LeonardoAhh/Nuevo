"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
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

export function ResenaForm({ onSubmit }: Props) {
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
  const disabled =
    submitting ||
    tooFast ||
    nombre.trim().length < 2 ||
    rating < 1 ||
    rating > 5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (honeypot.length > 0) {
      // silently swallow bots
      setNombre("")
      setComentario("")
      setRating(0)
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
      mountedAt.current = Date.now()
      setSecsLeft(MIN_TIME_SECS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al publicar reseña")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">Deja tu reseña</p>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Calificación</Label>
          <div className="flex h-9 items-center">
            <StarRating value={rating} onChange={setRating} size={22} />
            {rating > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
            )}
          </div>
        </div>
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
        />
        <p className="text-[11px] text-muted-foreground">{comentario.length}/2000</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" disabled={disabled} className="gap-1.5">
            <Send size={14} />
            {submitting ? "Publicando..." : "Publicar reseña"}
          </Button>
        </motion.div>
        {tooFast && (
          <span className="text-xs text-muted-foreground">
            Espera {Math.ceil(secsLeft)}s para publicar
          </span>
        )}
      </div>
    </form>
  )
}
